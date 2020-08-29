const Diff = require("diff");

let one =
  "Here is the first string. I have the second string. The third string is not as good as me.";
let two =
  "Here is the first string. I wish the second string. The Third string is not as good as.";
let three =
  "Here is the first string. I dont think the second string. The third string is not as great as me.";

let test1 =
  "Old Mr. Crow often remarked that if Grumpy Weasel really wanted to be of some use in the world he would spend his time at the sawmill filling knot holes in boards.";
//test1 = test1.replace(/[,\/#!$%\^&\*;:'{}=\-_`~()]/g, ""); //strip text of puncuation

let test2 =
  "Old mr crow often remarked that if the grumpy weasel really wanted to be of some use in the world he would spend his time at the sawmill filling knot holes in boards.";
test2 = test2.replace(/[,\/#!$%\^&\*;:'{}=\-_`~()]/g, "");

let test3 =
  "'He's so slender,' Mr. Crow would say, 'that he can push himself into a knot hole no bigger round than Farmer Green's thumb.'";
//test3 = test3.replace(/[,\/#!$%\^&\*;:'{}=\-_`~()]/g, "");

let test4 =
  "He is super slender mr crow would say that he can push himself into a knot hole no bigger round than farmer green's thumb.";
test4 = test4.replace(/[,\/#!$%\^&\*;:'{}=\-_`~()]/g, "");

let regTest =
  "Old Mr. Crow would Ms. pots that md. pepper or mrs. Pots is a Dr. who.";
regTest = regTest.replace(
  /(?<=(mr|Mr|Ms|md|Md|Dr|dr|mrs|Mrs|Sr|Jr|jr|sr))\./g,
  ""
);
// console.log(regTest);

//database book text mock
let databaseMock1 = [test1, test3];
//console.log(test5);
// test5 = test5.replace(/(?<=(mr|Mr|Ms|md|Md|Dr|dr|mrs|Mrs|Sr|Jr|jr|sr))\./g,"");
// test5 = test5.replace(/\./, ". ");

//Users response mock
let test6 = [test2, test4];
// test6 = test6.replace(/(?<=(mr|Mr|Ms|md|Md|Dr|dr|mrs|Mrs|Sr|Jr|jr|sr))\./g,"");
// test6 = test6.replace(/\./, ". ");

//reimplement to use diff words
let options = { ignoreCase: true };
let responseJSON = [];
let wordsWrong = [];
let sentencesWrong = [];
for (let i = 0; i < databaseMock1.length; i++) {
  if (i >= test6.length) {
    //User did not say this sentence and it is considered wrong
    sentencesWrong.push(i);
  } else {
    let bookText = removeMarks(databaseMock1[i]);
    let userText = removeMarks(test6[i]);
    let analysis = Diff.diffWords(bookText, userText, options);

    console.log(analysis);


    let toggle = false;
    let override = true;

    let bt = bookText.split(" ").length;
    let ut = userText.split(" ").length;

    if(bt != ut){
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

// let collapsed = "";
// for (let i = 0; i < remaining.length; i++) {
//   collapsed += remaining[i];
// }

//console.log(test5);
//console.log(test6);
// console.log(wordsWrong.length);
// for (let k = 0; k < wordsWrong.length; k++){
//     console.log(wordsWrong[k]);
// }
// console.log(sentencesWrong.length);
// for (let k = 0; k < sentencesWrong.length; k++){
//     console.log(sentencesWrong[k]);
// }
//console.log(collapsed);

let tex = test1 + test3;
let ans = findRange(tex,1);
console.log(ans);

let recompile = "";
for(let k = ans.start; k < ans.start + ans.length; k++)
{
  recompile += tex.charAt(k);
}
console.log(recompile);

////Splitting book paragraph into sentences: book is already broken into sentences via the backend R processing

//given a paragraph, and a sentence number(index), return the starting index of the sentence and its length
function findRange(str,index){
  //replace important periods with a temp placeholder
  let temp = str.replace(/(?<=(mr|Mr|Ms|md|Md|Dr|dr|mrs|Mrs|Sr|Jr|jr|sr))\./g, "\@")
  let chunk = temp.match(/[^.?!]+[.!?]+[\])'"`’”]*/g);
  for(let i = 0; i < chunk.length; i++)
  {
    chunk[i] = chunk[i].replace(/\@/g, "\.");
  }
  console.log(chunk);

  //calculate the starting index of the given sentence by summing the length of all previous sentences.
  let startIndex  = 0;
  for(let j = index-1; j >= 0; j--)
  {
    startIndex += chunk[j].length;
  }
  let length = chunk[index].length;

  let ans = { start: startIndex, length: length};
  return ans;
}


function removeMarks(str) {
  let newStr = str
    .replace(/(?<=(mr|Mr|Ms|md|Md|Dr|dr|mrs|Mrs|Sr|Jr|jr|sr))\./g, "")
    .replace(/\./, ". ");
  return newStr;
}
