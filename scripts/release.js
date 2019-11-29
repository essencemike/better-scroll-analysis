const execa = require('execa');
const semver = require('semver');
const inquirer = require('inquirer');
const chalk = require('chalk');

const curVersion = require('../lerna.json').version;

const release = async () => {
  console.log(chalk.yellow(`Current version: ${curVersion}`));

  const bumps = ['patch', 'minor', 'major', 'prerelease-alpha', 'prerelease-bata', 'premajor'];
  const versions = {};
  bumps.forEach(b => {
    const args = b.split('-');
    versions[b] = semver.inc(curVersion, ...args);
  });

  const bumpChoices = bumps.map(b => ({ name: `${b} (${versions[b]})`, value: b }));

  function getVersion(answers) {
    return answers.customVersion || versions[answers.bump];
  }

  function isPreRelease(version) {
    return !!semver.prerelease(version);
  }

  function getNpmTags(version) {
    if (isPreRelease(version)) {
      return ['next'];
    }

    return ['latest', 'next'];
  }

  const { bump, customVersion, npmTag } = await inquirer.prompt([
    {
      name: 'bump',
      message: 'Select release type:',
      type: 'list',
      choices: [
        ...bumpChoices,
        { name: 'custom', value: 'custom' }
      ]
    },
    {
      name: 'customVersion',
      message: 'Input version:',
      type: 'input',
      when: answers => answers.bump === 'custom'
    },
    {
      name: 'npmTag',
      message: 'Select npm tag:',
      type: 'list',
      choices: answers => getNpmTags(getVersion(answers))
    }
  ]);

  const version = customVersion || versions[bump];

  const { yes } = await inquirer.prompt([{
    name: 'yes',
    message: `Confirm releasing ${version} (${npmTag})?`,
    type: 'confirm'
  }]);

  if (!yes) {
    console.log(chalk.red('[release] cancelled.'));
    return;
  }

  const releaseArguments = [
    'publish',
    version,
    '--force-publish',
    '--npm-tag',
    npmTag,
    '*'
  ];

  console.log(chalk.gray(`lerna ${releaseArguments.join(' ')}`));

  await execa(require.resolve('lerna/cli'), releaseArguments, { stdio: 'inherit' });

  require('./genChangelog')(version);

  try {
    await execa('git', ['add', '-A'], { stdio: 'inherit' });
    await execa('git', ['commit', '-m', `chore: ${version} published`], { stdio: 'inherit' });
    await execa('git', ['push', 'origin', 'master'], { stdio: 'inherit' });
  } catch (error) {
    console.log(error);
  }

  // 将 master 同步到 dev
  await execa('git', ['checkout', 'dev'], { stdio: 'inherit' });
  await execa('git', ['rebase', 'master'], { stdio: 'inherit' });
  await execa('git', ['push', 'origin', 'dev'], { stdio: 'inherit' });
  await execa('git', ['checkout', 'master'], { stdio: 'inherit' });
};

release().catch(err => {
  console.log(err);
  process.exit(1);
});
