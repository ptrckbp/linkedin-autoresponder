# LinkedIn Autoresponder 

This is a Chrome extension that automatically answers people on LinkedIn. 
It presumes you will answer as Botpress, and answer posts written by Botpress. 

Note that the script will pause if someone writes something above the MAX_Chars, so you can't be away completely.

> :warning: **If it doesn't seem to work**: This script is dependant on Linkedin not changing their css selectors. If they do, this will break, so you have to play with the selectors found at the top of contentScript.js

## Using this extension

For non-developers who just want to use it, [download the prebuilt "build" folder here](https://github.com/ptrckbp/linkedin-autoresponder/releases/download/release/build.zip) and skip steps 1-4

1. `nvm install`
2. `npm i`
3. `npm run start` for dev
4. `npm run build` for production
5. Go to chrome://extensions in Google Chrome
6. Enable developer mode.
7. Click "Load unpacked", then select the "build" folder of this project
8. Go to the post page **under an account that can answer as the company account you want**. It should look something like this https://www.linkedin.com/feed/update/urn:li:activity:6925496095158468608/ 
9. The script will pause if someone writes something above the MAX_Chars, so you can't be away completely. Otherwise have fun!

> :warning: **Use a proper linkedin account**: Make sure your linkedin account can answer on behalf of the company you want, otherwise get ready to have your personal account respond as Openbook!

## Updating the code
The relevant code is src/js/contentScript.js (that's what's injected in the page) and src/manifest.json which determines when to inject the contentScript.js file.

## Configuration 
- If you want to post not as Botpress (default for PRODUCTION), but under another account, You need to change the LINKEDIN_COMPANY_ID and LINKEDIN_AUTHOR_HREF variables. 

- You can get the LINKEDIN_COMPANY_ID by going to your company page, logged in as an admin. 
The url should look like this https://www.linkedin.com/company/81588930/admin/. The company id is the number, 81588930 in this case. If you click "View as member", you should be redirected to something like this https://www.linkedin.com/company/jubjub-rockets/?viewAsMember=true. The author_href is https://www.linkedin.com/company/jubjub-rockets/ in this case.

- If your script is going to fast, and you internet is slow, try adding increments of 250 to GLOBAL_DELAY_MS below until everything works.

- If you want to change Openbook's book to another one, update OPENBOOK_ASK_ENDPOINT and OPENBOOK_QUESTIONS_ENDPOINT.

- Finally, if you want to see the text before submiting, set AUTO_RESPOND to false
