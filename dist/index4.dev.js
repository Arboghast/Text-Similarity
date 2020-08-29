"use strict";

var database = require("./reformatted4.json");

var Diff = require("diff"); //given a paragraph, and a sentence number(index), return the starting index of the sentence and its length


function findRange(para, index) {
  //calculate the starting index of the given sentence by summing the length of all previous sentences.
  var startIndex = 0;

  for (var j = index - 1; j >= 0; j--) {
    startIndex += para[j].length;
  }

  var length = para[index].length;
  var ans = {
    start: startIndex,
    length: 0,
    chars: length
  };
  return ans;
}

function stripPunctuation(str) {
  return str.replace(/[,\/#!$%\^&\*;:'"{}=\_`~()]/g, "").replace(/-/g, " ");
}

function removeMarks(str) {
  return str.replace(/(?<=(mr|Mr|Ms|md|Md|Dr|dr|mrs|Mrs|Sr|Jr|jr|sr))\./g, "").replace(/\./, ". ");
}

function splitIntoSentences(str) {
  if (/[^.?!]+[.!?]+[\])'"`’”]*/g.test(str)) {
    //prevent null return on .match() call
    var split = str.replace(/(?<=(mr|Mr|Ms|md|Md|Dr|dr|mrs|Mrs|Sr|Jr|jr|sr))\./g, "@").match(/[^.?!]+[.!?]+[\])'"`’”]*/g);

    for (var i = 0; i < split.length; i++) {
      split[i] = split[i].replace(/\@/g, ".");
    }

    return split;
  } else {
    return [str];
  }
} //assumes book paragraph and userParagraph are arrays of sentences


function analyseText(bookParagraph, userParagraph) {
  var wordsWrong = [];
  var sentencesWrong = [];
  var apostropheDictionary = {};

  for (var i = 0; i < bookParagraph.length; i++) {
    if (i >= userParagraph.length) {
      //if true, the user did not say this sentence and will be considered wrong
      sentencesWrong.push(i);
    } else {
      var apos = bookParagraph[i].match(/[\w]\w*'\w*/gm); //captures all words with an apostrophe

      if (apos != null) {
        for (var y = 0; y < apos.length; y++) {
          var key = apos[y].replace(/'/gm, "");
          apostropheDictionary[key] = apos[y]; //key value pairs-> hes : he's
        }
      }

      var _bookText = removeMarks(stripPunctuation(bookParagraph[i])).trim(); //console.log(bookText);


      var userText = removeMarks(stripPunctuation(userParagraph[i])).trim(); //console.log(userText)

      var analysis = Diff.diffWords(_bookText, userText, {
        ignoreCase: true
      });
      var toggle = false; //let override = true;
      // let bt = bookText.split(" ").length;
      // let ut = userText.split(" ").length;
      // if (bt != ut) {
      //   sentencesWrong.push(i); //if they are not the same length, then at least one word was added/removed
      //   override = false; //to prevent repeat additions of this sentence
      // }

      for (var j = 0; j < analysis.length; j++) {
        //if user adds a word, we cant highlight that word on the screen so no
        //need to pass it into the wrong words array, just mark the sentence as wrong as compensation
        if (analysis[j].removed) {
          wordsWrong.push(analysis[j].value.trim());
          toggle = true;
        }
      }

      if (toggle
      /*&& override*/
      ) {
          sentencesWrong.push(i); //at least one wrong word in the sentence makes the entire sentence wrong
        }
    }
  }

  var sentenceRanges = [];

  for (var _i = 0; _i < sentencesWrong.length; _i++) {
    var ans = findRange(bookParagraph, sentencesWrong[_i]);
    sentenceRanges.push(ans);
  } //condenses book paragraph into one string, to easily index the paragraph


  var bookCollapsed = "";

  for (var _i2 = 0; _i2 < bookParagraph.length; _i2++) {
    bookCollapsed += bookParagraph[_i2];
  } //combine wrong sentences into one string so the assistant can read it


  var recompile = "";

  for (var x = 0; x < sentenceRanges.length; x++) {
    var _ans = sentenceRanges[x];

    for (var k = _ans.start; k < _ans.start + _ans.chars; k++) {
      recompile += bookCollapsed.charAt(k);
    }
  }

  for (var _i3 = 0; _i3 < wordsWrong.length; _i3++) {
    if (apostropheDictionary.hasOwnProperty(wordsWrong[_i3])) {
      wordsWrong[_i3] = apostropheDictionary[wordsWrong[_i3]]; //replacing hes with he's for example
    }
  }

  var responseJSON = {
    ranges: sentenceRanges,
    words: wordsWrong,
    assistantOutput: recompile
  };
  return responseJSON;
}

var bookTitle = "The Book Of Dragons";
var chunk = 1;
var user = "He happened to be building a palace when the news came and he left all the bricks kicking about the floor for nurse to clear up but then the news was rather remarkable news. you see there was a knock at the door and voices talking downstairs and lionel thought it was the man come to see about the gas which had not been allowed to be lighted since the day when lionel made a swing by tying his skipping rope to the gas bracket.";
var bookText = database[bookTitle]["Text"][chunk]; //An Array of Sentences

console.log(bookText);
var userInput = splitIntoSentences(user); //split by puncuation

console.log(userInput);
var response = analyseText(bookText, userInput); //console.log(database[bookTitle]["Text"][chunk].length);

console.log(response);