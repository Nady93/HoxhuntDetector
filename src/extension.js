"use strict";

const $ = require("jquery");

// loader-code: wait until gmailjs has finished loading, before triggering actual extensiode-code.
const loaderId = setInterval(() => {
    if (!window._gmailjs) {
        return;
    }

    clearInterval(loaderId);
    startExtension(window._gmailjs);
}, 100);

const domainWhitelist = ["linkedin.com"];

// Copied from: https://www.tutorialspoint.com/levenshtein-distance-in-javascript
const levenshteinDistance = (str1 = '', str2 = '') => {
   const track = Array(str2.length + 1).fill(null).map(() =>
   Array(str1.length + 1).fill(null));
   for (let i = 0; i <= str1.length; i += 1) {
      track[0][i] = i;
   }
   for (let j = 0; j <= str2.length; j += 1) {
      track[j][0] = j;
   }
   for (let j = 1; j <= str2.length; j += 1) {
      for (let i = 1; i <= str1.length; i += 1) {
         const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
         track[j][i] = Math.min(
            track[j][i - 1] + 1, // deletion
            track[j - 1][i] + 1, // insertion
            track[j - 1][i - 1] + indicator, // substitution
         );
      }
   }
   return track[str2.length][str1.length];
};

function getSimilarityIndex(domain) {
    // @todo: first check if is on whitelist
    return 99;
    let highestSimilarity = 0;
    domainWhitelist.forEach(whitelistDomain => {
        let wdLength = whitelistDomain.length;        
        
        let lDist = levenshteinDistance(domain, whitelistDomain);
        let similarityLevel = ((wdLength - lDist) / wdLength) * 100;

        highestSimilarity = Math.max(highestSimilarity, similarityLevel);
    });

    return highestSimilarity;
}

function createMenu(domainSimilarityIndex) {
    let $menu = $('<span></span>');
    let $similarityIdx = $('<span>' + domainSimilarityIndex + '</span>');
    let $whitelistBtn = $('<button>+</button>');

    $menu.append($similarityIdx);
    $menu.append($whitelistBtn);
    
    return $menu;
}

// actual extension-code
function startExtension(gmail) {
    console.log("Extension loading...");
    window.gmail = gmail;

    gmail.observe.on("load", () => {
        const userEmail = gmail.get.user_email();
        console.log("Hello, " + userEmail + ". This is your extension talking!");

        gmail.observe.on("view_email", (domEmail) => {
            console.log("Looking at email:", domEmail);
            const emailData = gmail.new.get.email_data(domEmail);
            console.log("Email data:", emailData);
            const emailFrom = emailData.from.address;
            console.log("From:", emailFrom);

            const emailDomain = emailFrom.slice(emailFrom.indexOf("@") + 1, emailFrom.length);
            console.log("Domain:" + emailDomain);

            const domainSimilarityIndex = getSimilarityIndex(emailDomain);
            console.log("domainSimilarityIndex: " + domainSimilarityIndex);

            if (domainSimilarityIndex < 100 && domainSimilarityIndex > 50) {
                let $elMailSpan = domEmail.$el.first()
                    .find("h3")
                    .find("span")
                    .find("span:contains('@')");
                    
                $elMailSpan.css('background-color', 'yellow');

                let $menu = createMenu(domainSimilarityIndex);
                $menu.insertAfter($elMailSpan);
                // @todo: shades of red
            }
        });

        gmail.observe.on("compose", (compose) => {
            console.log("New compose window is opened!", compose);
        });
    });
}
