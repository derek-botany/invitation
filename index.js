const core = require('@actions/core');
const github = require('@actions/github');

async function checkCollaborators(octokit, thisOwner, thisRepo, thisUsername) {
    let returnVal = 'not a collaborator';
    try {
        const response =  await octokit.rest.repos.checkCollaborator({
            owner: thisOwner,
            repo: thisRepo,
            username: thisUsername,
          });
    if (response) {
        console.log('it is a response')
        if(response.status == 204) {
            returnVal = 'already collaborator'
            console.log('if statement got set to return valu')
        } else {
            returnVal= 'not collaborator'
            console.log('else statement got set to return valu')
        }
    }
    }catch (err) {
        return err
       
    }
    console.log(returnVal)
  return returnVal
 
}

async function addCollaborator(octokit, thisOwner, thisRepo, thisUsername) {
    try {
        await octokit.rest.repos.addCollaborator({
            owner: thisOwner,
            repo: thisRepo,
            username: thisUsername,
          });
        } catch(error) {
            console.log('ERROR: ' + error.message + ' occurred at ' + error.fileName + ':' + error.lineNumber);
         }
}

    async function addComment(octokit, thisOwner, thisRepo, thisIssueNumber, comment) {
        try {
            await octokit.rest.issues.createComment({
                owner: thisOwner,
                repo: thisRepo,
                issue_number: thisIssueNumber,
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
            console.log('was it received')
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
            thisUsername + '\n\tRepo Owner: ' + thisOwner);

        // check to make sure commenter is not owner (gives big error energy)
        if (thisUsername == thisOwner) {
            console.log('Commenter is the owner of this repository; exiting.');
            process.exit(0);
        } 
        
       
        // octokit.hook.after("request", async (response, options) => {
        //     console.log("Request options:\n" + JSON.stringify(options));
        //     console.log("Request response:\n" + JSON.stringify(response));
        //     console.log(`${options.method} ${options.url}: ${response.status}`);
    
        //     if (options.method == 'PUT' && response.status == 204) {
        //         // response has no body; log this info and exit
        //         console.log('User is already a collaborator; exiting.');
        //         process.exit(0);
        //     }
        // });
        const isUserCollaborator = await checkCollaborators(octokit, thisOwner, thisRepo, thisUsername)
        console.log(isUserCollaborator, 'THIS IS WHAT I NEED')
        if (isUserCollaborator.status == 404){
            await addCollaborator(octokit, thisOwner, thisRepo, thisUsername)
            // add comment to issue
            const comment = `@${thisUsername} has been added as a member of this repository. Please check your email or notifications for an invitation.`
            const label = 'collaborator added'
            await addComment(octokit, thisOwner, thisRepo, thisIssueNumber, comment);
            // add label to issue
            await addLabel(octokit, thisOwner, thisRepo, thisIssueNumber, label);
            // close issue
            await closeIssue(octokit, thisOwner, thisRepo, thisIssueNumber);
        } else if(isUserCollaborator == 'already collaborator') {
            const comment = `@${thisUsername} is already a member of this repository.`
            const label = `duplicate request`
            await addComment(octokit, thisOwner, thisRepo, thisIssueNumber, comment);
            // add label to issue
            await addLabel(octokit, thisOwner, thisRepo, thisIssueNumber, label);
            await closeIssue(octokit, thisOwner, thisRepo, thisIssueNumber);
        }

    } catch (error) {
        console.log('ERROR: ' + error.message + ' occurred at ' + error.fileName + ':' + error.lineNumber);
        console.log('Full error: ' + error);
        core.setFailed(error.message);
    }
}

 run()