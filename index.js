const core = require('@actions/core');
const github = require('@actions/github');

async function checkCollaborators(octokit, thisOwner, thisRepo, thisUsername) {
    try {
        await octokit.rest.repos.checkCollaborator({
            owner: thisOwner,
            repo: thisRepo,
            username: thisUsername,
          });
    } catch(error) {
      return error
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
     
   
        console.log('Parsed event values:\n\tRepo: ' + thisRepo + '\n\tUsername of commenter: ' +
            thisUsername + '\n\tRepo Owner: ' + thisOwner);

        // check to make sure commenter is not owner (gives big error energy)
        if (thisUsername == thisOwner) {
            console.log('Commenter is the owner of this repository; exiting.');
            process.exit(0);
        } 


        
        const isUserCollaborator = await checkCollaborators(octokit, thisOwner, thisRepo, thisUsername)
        if(isUserCollaborator.status == 204){
            console.log('we need to add collaborator')
        } else {
            (console.log('user is already added'))
        }
        // if (isUserCollaborator == undefined) {
        //     console.log('we need to add collaborator')
        //     await addCollaborator(octokit, thisOwner, thisRepo, thisUsername)
        // } else {
        //     console.log('User is already a collaborator; exiting.');
        //     process.exit(0);
        // }
    } catch (error) {
        console.log('ERROR: ' + error.message + ' occurred at ' + error.fileName + ':' + error.lineNumber);
        console.log('Full error: ' + error);
        core.setFailed(error.message);
    }
}

 run()
