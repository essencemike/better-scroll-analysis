const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const rollup = require('rollup');
const chalk = require('chalk');
const zlib = require('zlib');
const rimraf = require('rimraf');
const typescript = require('rollup-plugin-typescript2');
const uglify = require('rollup-plugin-uglify').uglify;
const shelljs = require('shelljs');
const ora = require('ora');
const spinner = ora({
  prefixText: `${chalk.green('\n[building tasks]')}`
});

function resolve(p) {
  return path.resolve(__dirname, '../', p);
}

function getPackagesName() {
  const all = fs.readdirSync(resolve('packages'));

  // 去掉以 . 开头的文件
  // 去掉不需要发布的文件（例如： examples 和 docs）

  return all.filter(name => {
    const isHiddenFile = /^\./g.test(name);
    return !isHiddenFile;
  }).filter(name => {
    const isPrivatePackages = require(resolve(`packages/${name}/package.json`)).private;
    return !isPrivatePackages;
  });
}

function cleanPackagesOldDist(packagesName) {
  packagesName.forEach(name => {
    const distPath = resolve(`packages/${name}/dist`);
    const typePath = resolve(`packages/${name}/dist/types`);

    if (fs.existsSync(distPath)) {
      rimraf.sync(distPath);
    }

    fs.mkdirSync(distPath);
    fs.mkdirSync(typePath);
  });
}

function PascalCase(str) {
  const re = /-(\w)/g;
  const newStr = str.replace(re, function(match, group1) {
    return group1.toUpperCase();
  });

  return newStr.charAt(0).toUpperCase() + newStr.slice(1);
}

const generateBanner = (packageName) => {
  const banner = `
    /*!\n
     * better-scroll-analysis / ${packageName} \n
     * (c) 2019-${new Date().getFullYear()} IMike\n
     * Released under the MIT License.\n
     */
  `;
  return banner;
};

const buildType = [
  {
    format: 'umd',
    ext: '.js'
  },
  {
    format: 'umd',
    ext: '.min.js'
  },
  {
    format: 'es',
    ext: '.esm.js'
  }
];

function generateBuildPluginsConfigs(isMin, packageName) {
  const tsConfig = {
    verbosity: -1,
    tsconfig: `./packages/${packageName}/tsconfig.json`
  };

  const plugins = [];
  if (isMin) {
    plugins.push(uglify());
  }
  plugins.push(typescript(tsConfig));

  return plugins;
}

function generateBuildConfigs(packagesName = []) {
  const result = [];
  packagesName.forEach(name => {
    buildType.forEach(type => {
      let config = {
        input: resolve(`packages/${name}/src/index.ts`),
        output: {
          file: resolve(`packages/${name}/dist/${name}${type.ext}`),
          name: PascalCase(name),
          format: type.format,
          banner: generateBanner(name)
        },
        plugins: generateBuildPluginsConfigs(type.ext.indexOf('min') > -1, name)
      };

      // 重命名
      if (name === 'core' && config.output.format !== 'es') {
        config.output.name = 'BScroll';
        // 禁用默认导入警告
        config.output.exports = 'named';
        // umd 捆绑包不能满足我们的需求
        config.output.footer = `if (typeof window !== 'undefined' && window.BScroll) {\n  window.BScroll = window.BScroll.default;\n}`;
      }

      // rollup 会验证我们自己配置的 config 的属性并输出警告
      // 将 packageName 放到 prototype 中以忽略警告
      Object.defineProperties(config, {
        'packageName': {
          value: name
        },
        'ext': {
          value: type.ext
        }
      });

      result.push(config);
    });
  });

  return result;
}

function copyDTSFiles(packageName) {
  console.log(chalk.cyan('> start copying .d.ts file to dist dir of packages own.'));
  const sourceDir = resolve(`packages/${packageName}/dist/packages/${packageName}/src/*`);
  const targetDir = resolve(`packages/${packageName}/dist/types/`);

  shelljs.cp('-R', sourceDir, targetDir);

  console.log(chalk.cyan('> copy job is done.'));

  rimraf.sync(resolve(`packages/${packageName}/dist/packages`));
  rimraf.sync(resolve(`packages/${packageName}/dist/node_modules`));
}

function getSize(code) {
  return (code.length / 1024).toFixed(2) + 'kb';
}

function buildEntry(config, curIndex, next) {
  const isProd = /min\.js$/.test(config.output.file);

  spinner.start(`${config.packageName}${config.ext} is building now. \n`);

  rollup.rollup(config).then(bundle => {
    bundle.write(config.output).then(({ output }) => {
      const code = output[0].code;

      spinner.succeed(`${config.packageName}${config.ext} building has ended.`);

      function report(extra) {
        console.log(chalk.magenta(path.relative(process.cwd(), config.output.file)) + ' ' + getSize(code) + (extra || ''));
        next();
      }

      if (isProd) {
        zlib.gzip(code, (err, zipped) => {
          if (err) return reject(err);
          const words = `(gzipped: ${chalk.magenta(getSize(zipped))})`;
          report(words);
        });
      } else {
        report();
      }

      // 由于我们有三种捆绑包的方式，但只要生成一次 .d.ts 文件即可
      if (curIndex % 3 === 0) {
        copyDTSFiles(config.packageName);
      }
    });
  }).catch(e => {
    spinner.fail('building is failed.');
    console.log(e);
  });
}

function build(builds) {
  let built = 0;
  const total = builds.length;
  const next = () => {
    buildEntry(builds[built], built + 1, () => {
      builds[built - 1] = null;
      built++;
      if (built < total) {
        next();
      }
    });
  };
  next();
}

const getAnswersFromInquirer = async (packagesName) => {
  const questions = {
    type: 'checkbox',
    name: 'packages',
    scroll: false,
    message: 'Select build repo(Support Multiple selection)',
    choices: packagesName.map(name => ({
      value: name,
      name,
    }))
  };

  let { packages } = await inquirer.prompt(questions);

  // 如果没有选择任何包
  if (!packages.length) {
    console.log(chalk.yellow(`
      It seems that you did't make a choice.

      Please try it again.
    `));
    return;
  }

  // 如果选择了全部
  if (packages.some(package => package === 'all')) {
    packages = getPackagesName();
  }

  const { yes } = await inquirer.prompt([{
    name: 'yes',
    message: `Confirm build ${packages.join(' and ')} packages?`,
    type: 'confirm'
  }]);

  if (!yes) {
    console.log(chalk.yellow('[release] cancelled.'));
    return;
  }

  return packages;
};

const buildBootstrap = async () => {
  const packagesName = getPackagesName();
  // 提供 all 选项
  packagesName.unshift('all');

  const answers = await getAnswersFromInquirer(packagesName);

  if (!answers) return;

  cleanPackagesOldDist(answers);

  const buildConfigs = generateBuildConfigs(answers);

  build(buildConfigs);
};

buildBootstrap().catch(err => {
  console.log(err);
  process.exit(1);
});
