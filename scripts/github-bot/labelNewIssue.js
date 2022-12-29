/**
 * Copyright (c) 2020-present, Goldman Sachs
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as github from '@actions/github';
import * as githubActionCore from '@actions/core';
import chalk from 'chalk';

/**
 * This script will automatically label new issue. Labelling rules are:
 * - If the issue creator is a member of the team, add the team label
 */
const labelNewIssue = async () => {
  const octokit = github.getOctokit(process.env.GITHUB_TOKEN);
  const issueLabel = process.env.ISSUE_LABEL;
  const issueEventPayload = github.context.payload.issue;

  if (!issueEventPayload) {
    githubActionCore.error(
      `Can't run this action: it must be triggered by an 'issues.opened' event. See https://docs.github.com/en/actions/learn-github-actions/events-that-trigger-workflows#issues`,
    );
    process.exit(1);
  }

  const issueNumber = issueEventPayload.number;

  console.log(`Labelling new issue...`);

  try {
    const issue = (
      await octokit.rest.issues.get({
        issue_number: issueNumber,
        ...github.context.repo,
      })
    ).data;

    // Add team label to issues created by team members
    console.log(
      `Adding team label '${issueLabel}' to issue '${issue.title}'...`,
    );
      try {
        await octokit.rest.issues.addLabels({
          issue_number: issueNumber,
          labels: [issueLabel],
          ...github.context.repo,
        });
        console.log(
          chalk.green(
            `\u2713 Added team label '${issueLabel}' to issue '${issue.title}'`,
          ),
        );
      } catch (error) {
        githubActionCore.error(
          `Can't add team label '${issueLabel}' to issue '${issue.title}'. Error:\n${error.message}\nPlease manually do so.`,
        );
      }
    
  } catch (error) {
    githubActionCore.error(`Can't label issue. Error:\n${error.message}`);
    process.exit(1);
  }
};

labelNewIssue();
