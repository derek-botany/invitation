const core = require('@actions/core');
const github = require('@actions/github');

async function checkCollaborators(octokit, thisOwner, thisRepo, thisUsername) {
    console.log('hey')
    try {
        await octokit.rest.repos.checkCollaborator({
            owner: thisOwner,
            repo: thisRepo,
            username: thisUsername,
          });
    } catch(error) {
       console.log(error) 
    }
}

async function addCollaborator(octokit, thisOwner, thisRepo, thisUsername) {
    try {
        await octokit.rest.repos.addCollaborator({
            owner: thisOwner,
            repo: thisRepo,
            username: thisUsername,
          });
        } catch(error) {
            console.log(error) 
         }
}

async function commentOnIssue(octokit, thisOwner, thisRepo, thisUsername, issueNumber) {
    console.log('here')
    try {
     const response =   await octokit.rest.issues.createComment({
            owner: thisOwner,
            repo: thisRepo,
            issue_number: issueNumber,
            body: `@${thisUsername}, you've been invited to collaborate on this repository. Please accept the invitation in your email or GitHub notifications.`,
          });
          console.log('comment on issue', response)
        } catch(error) {
            console.log(error) 
         }
}

async function closeIssue(octokit, thisOwner, thisRepo, issueNumber) {
    try {
        await octokit.rest.issues.update({
            owner: thisOwner,
            repo: thisRepo,
            issue_number: issueNumber,
            state: 'closed',
          });
        } catch(error) {
            console.log(error) 
         }
}

async function run() {
    try {
        // create Octokit client
        const thisToken = process.env.INVITATION_TOKEN;
        console.log('this is the token', thisToken)
        if (!thisToken) {
            console.log('ERROR: Token was not retrieved correctly and is falsy.');
            core.setFailed('Error: token was not correctly interpreted');
            console.log('was it received')
        }
        const octokit = new github.getOctokit(thisToken);
  
        // get comment
        const issueTitle = github.context.payload.issue.title;
        const regex = /(?<=@)\w+/g;
        const thisUsername = issueTitle.match(regex);
        const thisRepo = github.context.payload.issue.html_url
        const thisOwner = github.context.payload.repository.owner.login
        const issueNumber = github.context.payload.issue.number
     
   
        console.log('Parsed event values:\n\tRepo: ' + thisRepo + '\n\tUsername of commenter: ' +
            thisUsername + '\n\tRepo Owner: ' + thisOwner);

        // check to make sure commenter is not owner (gives big error energy)
        if (thisUsername == thisOwner) {
            console.log('Commenter is the owner of this repository; exiting.');
            process.exit(0);
        } else {
        }
        const isUserCollaborator = await checkCollaborators(octokit, thisOwner, thisRepo, thisUsername)
        console.log('this is user collaborator', isUserCollaborator)
        if (isUserCollaborator == undefined) {
            console.log('we need to add collaborator')
            await addCollaborator(octokit, thisOwner, thisRepo, thisUsername)
            await commentOnIssue(octokit, thisOwner, thisRepo, thisUsername, issueNumber)
            // await closeIssue(octokit, thisOwner, thisRepo, issueNumber)
        } else {
            console.log('User is already a collaborator; exiting.');
            process.exit(0);
        }
    } catch (error) {
        console.log('ERROR: ' + error.message + ' occurred at ' + error.fileName + ':' + error.lineNumber);
        console.log('Full error: ' + error);
        core.setFailed(error.message);
    }
}

 run()
