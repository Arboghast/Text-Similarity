const database = require("./reformatted4.json");
const Diff = require("diff");

//given a paragraph, and a sentence number(index), return the starting index of the sentence and its length
function findRange(para, index) {
  //calculate the starting index of the given sentence by summing the length of all previous sentences.
  let startIndex = 0;
  for (let j = index - 1; j >= 0; j--) {
    startIndex += para[j].length;
  }
  let length = para[index].length;

  let ans = { start: startIndex, length: 0, chars: length };
  return ans;
}

function stripPunctuation(str) {
  return str.replace(/[,\/#!$%\^&\*;:'"{}=\_`~()]/g, "").replace(/-/g, " ");
}

function removeMarks(str) {
  return str
    .replace(/(?<=(mr|Mr|Ms|md|Md|Dr|dr|mrs|Mrs|Sr|Jr|jr|sr))\./g, "")
    .replace(/\./, ". ");
}

function splitIntoSentences(str) {
  if (/[^.?!]+[.!?]+[\])'"`’”]*/g.test(str)) {
    //prevent null return on .match() call
    let split = str
      .replace(/(?<=(mr|Mr|Ms|md|Md|Dr|dr|mrs|Mrs|Sr|Jr|jr|sr))\./g, "@")
      .match(/[^.?!]+[.!?]+[\])'"`’”]*/g);

    for (let i = 0; i < split.length; i++) {
      split[i] = split[i].replace(/\@/g, ".");
    }
    return split;
  } else {
    return [str];
  }
}

//assumes book paragraph and userParagraph are arrays of sentences
function analyseText(bookParagraph, userParagraph) {
  let wordsWrong = [];
  let sentencesWrong = [];
  let apostropheDictionary = {};
  for (let i = 0; i < bookParagraph.length; i++) {
    if (i >= userParagraph.length) {
      //if true, the user did not say this sentence and will be considered wrong
      sentencesWrong.push(i);
    } else {
      let apos = bookParagraph[i].match(/[\w]\w*'\w*/gm); //captures all words with an apostrophe
      if (apos != null) {
        for (let y = 0; y < apos.length; y++) {
          let key = apos[y].replace(/'/gm, "");
          apostropheDictionary[key] = apos[y]; //key value pairs-> hes : he's
        }
      }

      let bookText = removeMarks(stripPunctuation(bookParagraph[i])).trim();
      //console.log(bookText);
      let userText = removeMarks(stripPunctuation(userParagraph[i])).trim();
      //console.log(userText)
      let analysis = Diff.diffWords(bookText, userText, { ignoreCase: true });

      let toggle = false;
      //let override = true;

      // let bt = bookText.split(" ").length;
      // let ut = userText.split(" ").length;

      // if (bt != ut) {
      //   sentencesWrong.push(i); //if they are not the same length, then at least one word was added/removed
      //   override = false; //to prevent repeat additions of this sentence
      // }

      for (let j = 0; j < analysis.length; j++) {
        //if user adds a word, we cant highlight that word on the screen so no
        //need to pass it into the wrong words array, just mark the sentence as wrong as compensation
        if (analysis[j].removed) {
          wordsWrong.push(analysis[j].value.trim());
          toggle = true;
        }
      }

      if (toggle /*&& override*/) {
        sentencesWrong.push(i); //at least one wrong word in the sentence makes the entire sentence wrong
      }
    }
  }

  let sentenceRanges = [];
  for (let i = 0; i < sentencesWrong.length; i++) {
    let ans = findRange(bookParagraph, sentencesWrong[i]);
    sentenceRanges.push(ans);
  }

  //condenses book paragraph into one string, to easily index the paragraph
  let bookCollapsed = "";
  for (let i = 0; i < bookParagraph.length; i++) {
    bookCollapsed += bookParagraph[i];
  }

  //combine wrong sentences into one string so the assistant can read it
  let recompile = "";
  for (let x = 0; x < sentenceRanges.length; x++) {
    let ans = sentenceRanges[x];
    for (let k = ans.start; k < ans.start + ans.chars; k++) {
      recompile += bookCollapsed.charAt(k);
    }
  }

  for (let i = 0; i < wordsWrong.length; i++) {
    if (apostropheDictionary.hasOwnProperty(wordsWrong[i])) {
      wordsWrong[i] = apostropheDictionary[wordsWrong[i]]; //replacing hes with he's for example
    }
  }

  let responseJSON = {
    ranges: sentenceRanges,
    words: wordsWrong,
    assistantOutput: recompile,
  };

  return responseJSON;
}

const bookTitle = "The Book Of Dragons";
const chunk = 1;
const user = "He happened to be building a palace when the news came and he left all the bricks kicking about the floor for nurse to clear up but then the news was rather remarkable news. you see there was a knock at the door and voices talking downstairs and lionel thought it was the man come to see about the gas which had not been allowed to be lighted since the day when lionel made a swing by tying his skipping rope to the gas bracket.";

let bookText = database[bookTitle]["Text"][chunk]; //An Array of Sentences
console.log(bookText);
let userInput = splitIntoSentences(user); //split by puncuation
console.log(userInput);

let response = analyseText(bookText, userInput);
//console.log(database[bookTitle]["Text"][chunk].length);
console.log(response);
