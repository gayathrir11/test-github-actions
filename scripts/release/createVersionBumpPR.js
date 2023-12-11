import * as github from "@actions/github";
import * as githubActionCore from "@actions/core";
import chalk from "chalk";
import { execSync } from "child_process";

const DEFAULT_BRANCH_NAME = "main";
const PREPARE_RELEASE_PR_BRANCH_NAME = "bot/prepare-release";

const prepareNewStandardRelease = async () => {
  const octokit = github.getOctokit(process.env.GITHUB_TOKEN);
  const bumpType = process.env.BUMP_TYPE;
  const PACKAGE_JSON_PATH = "package.json";

  // Push release version bump changeset
  console.log(`Creating release version bump PR...`);

  try {
    const defaultBranchRef = (
      await octokit.rest.git.getRef({
        ref: `heads/${DEFAULT_BRANCH_NAME}`,
        ...github.context.repo,
      })
    ).data;
    // clean the PR branch just in case
    try {
      await octokit.rest.git.deleteRef({
        ref: `heads/${PREPARE_RELEASE_PR_BRANCH_NAME}`,
        ...github.context.repo,
      });
    } catch (e) {
      // do nothing
    }
    await octokit.rest.git.createRef({
      // NOTE: this must be the fully qualified reference (e.g. refs/heads/main)
      // See https://docs.github.com/en/rest/reference/git?query=delete+a+reference#create-a-reference
      ref: `refs/heads/${PREPARE_RELEASE_PR_BRANCH_NAME}`,
      sha: defaultBranchRef.object.sha,
      ...github.context.repo,
    });

    // Use npm version to update the version based on the specified type
    execSync(`npm version ${bumpType}`, { stdio: "inherit" });

    let existingChangesetFile;
    let existingChangesetFileContent;
    try {
      existingChangesetFile = (
        await octokit.rest.repos.getContent({
          path: PACKAGE_JSON_PATH,
          ...github.context.repo,
        })
      ).data;
      existingChangesetFileContent = Buffer.from(
        existingChangesetFile.content,
        "base64"
      ).toString("utf-8");
    } catch (error) {
      githubActionCore.error(`Failed to find file. Error:\n${error.message}\n`);
      process.exit(1);
    }

    await octokit.rest.repos.createOrUpdateFileContents({
      path: PACKAGE_JSON_PATH,
      message: "prepare for new release",
      branch: PREPARE_RELEASE_PR_BRANCH_NAME,
      content: existingChangesetFileContent,
      // 'sha' is required when we update the file, i.e the changeset file exists but its content is stale
      // See https://docs.github.com/en/rest/reference/repos#create-or-update-file-contents
      sha: existingChangesetFile?.sha,
      ...github.context.repo,
    });

    const bumpVersionPR = (
      await octokit.rest.pulls.create({
        title: `Prepare New ${
          bumpType === "major" ? "Release" : "Iteration Release"
        }`,
        head: PREPARE_RELEASE_PR_BRANCH_NAME,
        base: DEFAULT_BRANCH_NAME,
        ...github.context.repo,
      })
    ).data;
    console.log(
      chalk.green(
        `\u2713 Created a PR to push release version bump : ${bumpVersionPR.html_url}`
      )
    );
  } catch (error) {
    githubActionCore.error(
      `Failed to create PR for next release version bump. Error:\n${error.message}\n`
    );
    process.exit(1);
  }
};

prepareNewStandardRelease();
