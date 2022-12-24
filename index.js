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
        const thisComment = github.context.payload['comment']['body'];
   
        const thisCommentLower = thisComment.toLowerCase();

        if (thisCommentLower.startsWith('inviteme') || thisCommentLower.startsWith('invite me')) {
            /* begin core invitation logic */
            // TODO: add support for mentioning a different user
            // determine variable values
            let thisRepo = github.context.payload['repository']['name'];    // e.g. 'inviteme'
           
            let thisUsername = github.context.payload['comment']['user']['login'];  // e.g. 'etcadinfinitum'
  
            let thisOwner = github.context.payload['repository']['owner']['login']; // e.g. 'etcadinfinitum'

            let thisIssueNumber = github.context.payload['issue']['number'];        // e.g. 1
       
            let thisPermission = null;
            console.log('Parsed event values:\n\tRepo: ' + thisRepo + '\n\tUsername of commenter: ' + 
                        thisUsername + '\n\tRepo Owner: ' + thisOwner + '\n\tIssue number: ' + thisIssueNumber);

            // check to make sure commenter is not owner (gives big error energy)
            if (thisUsername == thisOwner) {
                console.log('Commenter is the owner of this repository; exiting.');
                process.exit(0);
            } else {
                console.log('not an owner')
            }
            const isUserCollaborator = await checkCollaborators(octokit, thisOwner, thisRepo, thisUsername)

            if(isUserCollaborator == undefined) {
               console.log('we need to add collaborator')
            } else {
                console.log('User is already a collaborator; exiting.');
                process.exit(0);
            }
        }
//             /*
//             // check if user is a collaborator
           


            
//             */
//             // get response for addCollaborator call
//             // add hook to handle empty response body
//             octokit.hook.after("request", async (response, options) => {
//                 console.log("Request options:\n" + JSON.stringify(options));
//                 console.log("Request response:\n" + JSON.stringify(response));
//                 console.log(`${options.method} ${options.url}: ${response.status}`);
//                 // this validation is trash, but so are the docs for the returned objects T_T
//                 if (options.method == 'PUT' && response.status == 204) {
//                     // response has no body; log this info and exit
//                     console.log('User is already a collaborator; exiting.');
//                     process.exit(0);
//                 }
//             });

//             const { data: addedCollaborator } = await octokit.repos.addCollaborator({
//                 owner: thisOwner,
//                 repo: thisRepo,
//                 username: thisUsername,
//             });
            
//             // more variable values
//             let thisInviteLink = addedCollaborator['html_url'];
//             let thisBody = '@' + thisUsername + ' ' + thisInviteLink;
//             console.log('Parsed added collaborator values:\n\tInvite link: ' + thisInviteLink + 
//                         '\n\tNew comment body: ' + thisBody);
//             // comment on issue with invitation link for repo
//             const { data: commentResponse } = await octokit.issues.createComment({
//                 owner: thisOwner,
//                 repo: thisRepo,
//                 issue_number: thisIssueNumber,
//                 body: thisBody,
//             });
//         } else {
//             console.log('User comment is not an invitation request. Exiting.');
//         }
    } catch (error) {
        console.log('ERROR: ' + error.message + ' occurred at ' + error.fileName + ':' + error.lineNumber);
        console.log('Full error: ' + error);
        core.setFailed(error.message);
    }
}

 run()
