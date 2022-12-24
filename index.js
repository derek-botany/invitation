const core = require('@actions/core');
const github = require('@actions/github');

async function checkCollaborators(octokit, thisOwner, thisRepo, thisUsername) {
    const response = await octokit.rest.repos.checkCollaborator({
        owner: thisOwner,
        repo: thisRepo,
        username: thisUsername,
    })
    console.log(response)
}

async function addCollaborator(octokit, owner, repo, username) {
    try {
        await octokit.rest.repos.addCollaborator({
            owner,
            repo,
            username,
        });
    } catch (error) {
        console.log('ERROR: ' + error.message + ' occurred at ' + error.fileName + ':' + error.lineNumber);
    }
}

async function addComment(octokit, owner, repo, issueNumber, comment) {
    try {
        await octokit.rest.issues.createComment({
            owner: owner,
            repo: repo,
            issue_number: issueNumber,
            body: comment
        });
    } catch (error) {
        console.log('ERROR: ' + error.message + ' occurred at ' + error.fileName + ':' + error.lineNumber);
    }
}

async function closeIssue(octokit, thisOwner, thisRepo, thisIssueNumber) {
    try {
        await octokit.rest.issues.update({
            owner: thisOwner,
            repo: thisRepo,
            issue_number: thisIssueNumber,
            state: 'closed'
        });
    } catch (error) {
        console.log('ERROR: ' + error.message + ' occurred at ' + error.fileName + ':' + error.lineNumber);
    }
}

async function addLabel(octokit, thisOwner, thisRepo, thisIssueNumber, label) {
    try {
        await octokit.rest.issues.addLabels({
            owner: thisOwner,
            repo: thisRepo,
            issue_number: thisIssueNumber,
            labels: [label]
        });
    } catch (error) {
        console.log('ERROR: ' + error.message + ' occurred at ' + error.fileName + ':' + error.lineNumber);
    }
}

async function run() {
    try {
        // create Octokit client
        const thisToken = process.env.INVITATION_TOKEN;
        if (!thisToken) {
            console.log('ERROR: Token was not retrieved correctly and is falsy.');
            core.setFailed('Error: token was not correctly interpreted');
        }
        const octokit = new github.getOctokit(thisToken);

        // get comment
        const issueTitle = github.context.payload.issue.title;
        const regex = /(?<=@)\w+/g;
        const thisUsername = issueTitle.match(regex)[0];
        const thisRepo = github.context.payload.repository.name
        const thisOwner = github.context.payload.repository.owner.login
        const thisIssueNumber = github.context.payload.issue.number


        console.log('Parsed event values:\n\tRepo: ' + thisRepo + '\n\tUsername of commenter: ' +
            thisUsername + '\n\tRepo Owner: ' + thisOwner + '\n\tIssue Number: ' + thisIssueNumber);

        // check to make sure commenter is not owner (gives big error energy)
        if (thisUsername == thisOwner) {
            console.log('Commenter is the owner of this repository; exiting.');
            process.exit(0);
        }
        console.log('slowly uncomment')
        // const isUserCollaborator = await checkCollaborators(octokit, thisOwner, thisRepo, thisUsername)
        // if (isUserCollaborator.status == 204) {
        //     const comment = `@${thisUsername} is already a member of this repository.`
        //     const label = `duplicate request`
        //     await addComment(octokit, thisOwner, thisRepo, thisIssueNumber, comment);
        //     await addLabel(octokit, thisOwner, thisRepo, thisIssueNumber, label);
        //     // close issue
        //     await closeIssue(octokit, thisOwner, thisRepo, thisIssueNumber);
        // } else {
        //     await addCollaborator(octokit, thisOwner, thisRepo, thisUsername)
        //     // add comment to issue
        //     const comment = `@${thisUsername} has been added as a member of this repository. Please check your email or notifications for an invitation.`
        //     const label = 'collaborator added'
        //     await addComment(octokit, thisOwner, thisRepo, thisIssueNumber, comment);
        //     // add label to issue
        //     await addLabel(octokit, thisOwner, thisRepo, thisIssueNumber, label);
        //     // close issue
        //     await closeIssue(octokit, thisOwner, thisRepo, thisIssueNumber);
        // }
    } catch (error) {
        console.log('ERROR: ' + error.message + ' occurred at ' + error.fileName + ':' + error.lineNumber);
        console.log('Full error: ' + error);
        core.setFailed(error.message);
    }
}

run()
