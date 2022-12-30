import * as github from '@actions/github';
import * as githubActionCore from '@actions/core';
import chalk from 'chalk';

const addMilestone = async () => {
    const octokit = github.getOctokit(process.env.GITHUB_TOKEN);
    const defaultMilestoneTitle = process.env.DEFAULT_MILESTONE;
    const issueEventPayload = github.context.payload.issue;

    if (!issueEventPayload) {
        githubActionCore.error(
          `Can't run this action: it must be triggered by an 'issues.opened' event. See https://docs.github.com/en/actions/learn-github-actions/events-that-trigger-workflows#issues`,
        );
        process.exit(1);
      }
    
      const issueNumber = issueEventPayload.number;
  
      console.log(
        `Checking if milestone already exists for the issue...`,
      );
      try {

        const issue = (
            await octokit.rest.issues.get({
              issue_number: issueNumber,
              ...github.context.repo,
            })
          ).data;
        
          
        if (!issue.milestone) {
            console.log(`Checking if default milestone exists...`);
            const openMilestones = (
                await octokit.rest.issues.listMilestones({
                  state: 'open',
                  ...github.context.repo,
                })
              ).data
        
        const defaultMilestone = openMilestones.find(
            (milestone) => milestone.title === defaultMilestoneTitle,
          );
        if (defaultMilestone) {
            await octokit.rest.issues.update({
                issue_number: issue.number,
                milestone: defaultMilestone.number,
                ...github.context.repo,
              });
              console.log(
                chalk.green(
                  `Added ${defaultMilestoneTitle} to the issue ${issue.number}`,
                ),
              );
        }
          
    }
          
      } catch (error) {
        githubActionCore.error(
          `Unable to add milestone. Error:\n${error.message}`,
        );
      }
  };
  
  addMilestone();