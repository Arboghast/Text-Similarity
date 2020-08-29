const Diff = require("diff");

let test1 =
  "Old Mr. Crow often remarked that if Grumpy Weasel really wanted to be of some use in the world he would spend his time at the sawmill filling knot holes in boards.";

let test2 =
  "Old mr crow often remarked that if the grumpy weasel really wanted to be of some use in the world he would spend his time at the sawmill filling knot holes in boards.";

let test3 =
  "'He's so slender,' Mr. Crow would say, 'that he can push himself into a knot hole no bigger round than Farmer Green's thumb.'";

let test4 =
  "He is super slender mr crow would say that he can push himself into a knot hole no bigger round than farmer green's thumb.";

let realTest = [
  "Naturally it did not please old mr crow when solomon owl went out of his way one day to tell him that he was sadly mistaken.",
  " For after hearing some gossip repeat mr crow's opinion Solomon owl the wise old bird had given sev long hoots and hurried off though it was broad daylight to set mr. crow right.",
];
let realData =
  "Naturally it did not please old Mr. Crow when Solomon Owl went out of his way one day to tell him that he was sadly mistaken. For after hearing some gossip repeat Mr. Crow's opinion Solomon Owl--the wise old bird--had given several long hoots and hurried off, though it was broad daylight, to set Mr. Crow right.";

let realData2 = "A Grumpy Weasel";

let database = [ 'However, she prepared supper, and bade Aladdin seek his uncle, who came laden with wine and fruit.',
  "He fell down and kissed the place where Mustapha used to sit, bidding Aladdin\'s mother not to be surprised at not having seen him before, as he had been forty years out of the country.",
  'He then turned to Aladdin, and asked him his trade, at which the boy hung his head, while his mother burst into tears.',
  'On learning that Aladdin was idle and would learn no trade, he offered to take a shop for him and stock it with merchandise.' ]

//Database book text mock
let databaseMock1 = database

//Users response mock
let test6 = realTest;

let options = { ignoreCase: true };
let wordsWrong = [];
let sentencesWrong = [];
let apostropheDictionary = {};
for (let i = 0; i < databaseMock1.length; i++) {
  if (i >= test6.length) {
    //User did not say this sentence and it is considered wrong
    sentencesWrong.push(i);
  } else {
    let apos = databaseMock1[i].match(/[\w]\w*'\w*/gm); //captures all words with an apostrophe
    if (apos != null) {
      for (let y = 0; y < apos.length; y++) {
        let key = apos[y].replace(/'/gm, "");
        apostropheDictionary[key] = apos[y]; //key value pairs-> hes : he's
      }
    }

    let bookText = removeMarks(stripPunctuation(databaseMock1[i]));
    let userText = removeMarks(stripPunctuation(test6[i]));
    let analysis = Diff.diffWords(bookText, userText, options);

    console.log(analysis);

    let toggle = false;
    let override = true;

    let bt = bookText.split(" ").length;
    let ut = userText.split(" ").length;

    if (bt != ut) {
      sentencesWrong.push(i); //if they are not the same length, then at least one word was added/removed
      override = false; //to prevent repeat additions of this sentence
    }

    for (let j = 0; j < analysis.length; j++) {
      //if user adds a word, we cant highlight that word on the screen so no
      //need to pass it into the words wrong array, jsut mark the sentence as wrong as compensation
      if (analysis[j].removed) {
        wordsWrong.push(analysis[j].value);
        toggle = true;
      }
    }

    if (toggle && override) {
      sentencesWrong.push(i); //at least one word wrong in the sentence makes the entire sentence wrong
    }
  }
}

// console.log(wordsWrong.length);
// for (let k = 0; k < wordsWrong.length; k++){
//     console.log(wordsWrong[k]);
// }
// console.log(sentencesWrong.length);
// for (let k = 0; k < sentencesWrong.length; k++){
//     console.log(sentencesWrong[k]);
// }

let databaseMockCollapsed1 = "";
for (let i = 0; i < databaseMock1.length; i++) {
    databaseMockCollapsed1 += databaseMock1[i];
}
// console.log(databaseMock1);
// console.log(splitBySentences(databaseMockCollapsed1));
let sentenceRanges = [];
for (let i = 0; i < sentencesWrong.length; i++) {
  let ans = findRange(databaseMockCollapsed1, sentencesWrong[i]);
  sentenceRanges.push(ans);
}

//TEST
// for(let k = 0; k < sentenceRanges.length; k++)
// {
//     console.log(sentenceRanges[k]);
// }

//combine wrong sentences into one string so the assistant can read it
let recompile = "";
for (let x = 0; x < sentenceRanges.length; x++) {
  let ans = sentenceRanges[x];
  for (let k = ans.start; k < ans.start + ans.length; k++) {
    recompile += databaseMockCollapsed1.charAt(k);
  }
}
//console.log(recompile); //output for the google assistant to read

// for(apos in apostropheDictionary){
//     console.log(apos, apostropheDictionary[apos]);
// }

for (let i = 0; i < wordsWrong.length; i++) {
  if (apostropheDictionary.hasOwnProperty(wordsWrong[i])) {
    wordsWrong[i] = apostropheDictionary[wordsWrong[i]]; //replacing hes with he's for example
  }
}

let responseJSON = {
  //send to the frontend to configure
  ranges: sentenceRanges,
  words: wordsWrong,
};

console.log(responseJSON);

// let splitTest = "old mr crow. i like how that words! Waht is this style of punctuation!";
// splitTest = splitBySentences(splitTest);
// for(let i = 0; i < splitTest.length; i++)
// {
//     console.log(splitTest);
// }

////Splitting book paragraph into sentences: book is already broken into sentences via the backend R processing

//given a paragraph, and a sentence number(index), return the starting index of the sentence and its length
function findRange(str, index) {
  //replace important periods with a temp placeholder
  let chunk = splitBySentences(str);

  //console.log(chunk);

  //calculate the starting index of the given sentence by summing the length of all previous sentences.
  let startIndex = 0;
  for (let j = index - 1; j >= 0; j--) {
    startIndex += chunk[j].length;
  }
  let length = chunk[index].length;

  let ans = { start: startIndex, length: length };
  return ans;
}

function removeMarks(str) {
  return str
    .replace(/(?<=(mr|Mr|Ms|md|Md|Dr|dr|mrs|Mrs|Sr|Jr|jr|sr))\./g, "")
    .replace(/\./, ". ");
}

function stripPunctuation(str) {
  return str.replace(/[,\/#!$%\^&\*;:'{}=\_`~()]/g, "").replace(/-/g, " ");
}

function splitBySentences(str) {
  if (/[^.?!]+[.!?]+[\])'"`’”]*/g.test(str)) {
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
