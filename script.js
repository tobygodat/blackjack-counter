// Blackjack Card Counter - Hi-Lo system
// School project

var runningCount = 0;
var cardsSeen = 0;
var history = [];

var cardValues = {
  "2": 1, "3": 1, "4": 1, "5": 1, "6": 1,
  "7": 0, "8": 0, "9": 0,
  "10": -1, "J": -1, "Q": -1, "K": -1, "A": -1
};

function getDecks() {
  var d = parseInt(document.getElementById("deckCount").value);
  if (isNaN(d) || d < 1) {
    d = 1;
  }
  return d;
}

function updateDisplay() {
  var decks = getDecks();
  var cardsTotal = decks * 52;
  var cardsLeft = cardsTotal - cardsSeen;
  if (cardsLeft < 0) {
    cardsLeft = 0;
  }
  var decksLeft = cardsLeft / 52;

  var trueCount = 0;
  if (decksLeft > 0) {
    trueCount = runningCount / decksLeft;
  }

  // Bet suggestion
  var bet = "1 unit";
  if (trueCount >= 2 && trueCount < 3) {
    bet = "2 units";
  } else if (trueCount >= 3 && trueCount < 4) {
    bet = "4 units";
  } else if (trueCount >= 4 && trueCount < 5) {
    bet = "6 units";
  } else if (trueCount >= 5) {
    bet = "8 units";
  }

  document.getElementById("runningCount").innerText = runningCount;
  document.getElementById("trueCount").innerText = trueCount.toFixed(2);
  document.getElementById("bet").innerText = bet;
  document.getElementById("cardsSeen").innerText = cardsSeen;
  document.getElementById("decksLeft").innerText = decksLeft.toFixed(2);

  if (history.length === 0) {
    document.getElementById("history").innerText = "No cards yet.";
  } else {
    document.getElementById("history").innerText = history.join(", ");
  }
}

function addCard(card) {
  runningCount = runningCount + cardValues[card];
  cardsSeen = cardsSeen + 1;
  history.push(card);
  updateDisplay();
}

function undo() {
  if (history.length === 0) {
    return;
  }
  var last = history.pop();
  runningCount = runningCount - cardValues[last];
  cardsSeen = cardsSeen - 1;
  updateDisplay();
}

function reset() {
  runningCount = 0;
  cardsSeen = 0;
  history = [];
  updateDisplay();
}

// Hook up buttons
var cardButtons = document.getElementsByClassName("card-btn");
for (var i = 0; i < cardButtons.length; i++) {
  cardButtons[i].onclick = function() {
    addCard(this.getAttribute("data-card"));
  };
}

document.getElementById("undoBtn").onclick = undo;
document.getElementById("resetBtn").onclick = reset;
document.getElementById("deckCount").onchange = updateDisplay;

updateDisplay();
