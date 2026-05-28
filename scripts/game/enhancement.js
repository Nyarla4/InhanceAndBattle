// 확률형 강화 및 열화 연산
// scripts/game/enhancement.js

/* 네즈밍 강화 기반
var curImg = 9;
const images = ["./img/mayo/01_마요.png", "./img/mayo/02_바오밥나무.png", "./img/mayo/03_볼드의대형해머.png", "./img/mayo/04_처형자의대검.png", "./img/mayo/05_클레이모어.png", "./img/mayo/06_바스타드소드.png", "./img/mayo/07_야구빠따.png", "./img/mayo/08_커터칼.png", "./img/mayo/09_눈썹칼.png", "./img/mayo/10_이쑤시개.png"];
const names = ["미도미도 마요", "바오밥나무 네즈밍", "볼드의 대형 해머 네즈밍", "처형자의 대검 네즈밍", "클레이모어 네즈밍", "바스타드 소드 네즈밍", "야구빠따 네즈밍", "커터칼 네즈밍", "눈썹칼 네즈밍", "이쑤시개 네즈밍"];
const percentages = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90]
//const revPercentages = [90, 80, 70, 60, 50, 40, 30, 20, 10, 0]
const curImage = document.getElementById("image");
const curText = document.getElementById("text");
const curPerc = document.getElementById("perc");
//const curRePerc = document.getElementById("revPerc");
const record = document.getElementById("rec");
const setImage = (num) => {
    curImage.src = images[num];
}
const setContext = (num) => {
    setImage(num);
    curText.innerText = `${curImg + 1}위 ${names[num]}`;
    curPerc.innerText = "강화확률: " + percentages[curImg] + "%";
    //curRePerc.innerText = revPercentages[curImg] > 0 ? "약화확률: " + revPercentages[curImg] + "%" : "";
    const best = Math.min(curImg, localStorage.getItem("best"));
    localStorage.setItem("best", best);
    record.innerText = `최고 기록: ${best + 1}위`;
    setLog(best);
}
const setLog = (num) => {
    const logDiv = document.getElementById("logged");
    logDiv.innerHTML = "";
    for (let idx = num; idx <= 9; idx++) {
        logDiv.innerHTML += `<a onclick="setImage(${idx})">${idx + 1}</a> `

    }
}
const getPercentage = () => Math.floor(Math.random() * 100);
const setRandom = () => {
    const perc = percentages[curImg];
    //const revPerc = revPercentages[curImg];
    let getPerc = getPercentage();
    if (getPerc <= perc && curImg > 0) {
        curImg -= 1;
    }
    else {
        getPerc = getPercentage();
        if (getPerc <= 50 && curImg < 9) {
            curImg += 1;
        }
    }
    setContext(curImg);
}
const reset = () => {
    localStorage.clear();
    curImg = 9;
    localStorage.setItem("best", curImg);
    setContext(curImg);
}
const init = () => {
    if (localStorage.getItem("best") == null) {
        localStorage.setItem("best", curImg);
    }
    setContext(curImg);
}
init();
*/