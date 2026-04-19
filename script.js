// Blackjack Card Counter - Hi-Lo system
// School project

var runningCount = 0;
var cardsSeen = 0;
var history = [];

var shoe = [];
var playerHand = [];
var dealerHand = [];
var bankroll = 100;
var currentBet = 10;
var gameState = "none"; // "none", "playing", "done"
var canDouble = false;

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

function buildShoe() {
  var decks = getDecks();
  var ranks = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];
  var suits = ["\u2660","\u2665","\u2666","\u2663"]; // spade, heart, diamond, club
  shoe = [];
  for (var d = 0; d < decks; d++) {
    for (var r = 0; r < ranks.length; r++) {
      for (var s = 0; s < suits.length; s++) {
        shoe.push({ rank: ranks[r], suit: suits[s] });
      }
    }
  }
  // Fisher-Yates shuffle
  for (var i = shoe.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = shoe[i];
    shoe[i] = shoe[j];
    shoe[j] = tmp;
  }
  runningCount = 0;
  cardsSeen = 0;
  history = [];
}

function drawFromShoe() {
  if (shoe.length === 0) {
    buildShoe();
  }
  var card = shoe.pop();
  runningCount = runningCount + cardValues[card.rank];
  cardsSeen = cardsSeen + 1;
  history.push(card.rank);
  return card;
}

function cardPoints(rank) {
  if (rank === "A") return 11;
  if (rank === "J" || rank === "Q" || rank === "K") return 10;
  return parseInt(rank);
}

function handTotal(hand) {
  var total = 0;
  var aces = 0;
  for (var i = 0; i < hand.length; i++) {
    total = total + cardPoints(hand[i].rank);
    if (hand[i].rank === "A") {
      aces = aces + 1;
    }
  }
  while (total > 21 && aces > 0) {
    total = total - 10;
    aces = aces - 1;
  }
  return total;
}

function formatHand(hand, hideSecond) {
  var parts = [];
  for (var i = 0; i < hand.length; i++) {
    if (hideSecond && i === 1) {
      parts.push("??");
    } else {
      parts.push(hand[i].rank + hand[i].suit);
    }
  }
  return parts.join(" ");
}

function setGameMsg(msg) {
  document.getElementById("gameMsg").innerText = msg;
}

function deal() {
  if (gameState === "playing") {
    return;
  }
  var bet = parseInt(document.getElementById("betInput").value);
  if (isNaN(bet) || bet < 1) {
    setGameMsg("Enter a valid bet.");
    return;
  }
  if (bet > bankroll) {
    setGameMsg("You don't have enough money.");
    return;
  }

  // Reshuffle if shoe is too low
  if (shoe.length < 15) {
    buildShoe();
    setGameMsg("Shoe was low, dealer reshuffled. Count reset.");
  }

  currentBet = bet;
  playerHand = [];
  dealerHand = [];
  playerHand.push(drawFromShoe());
  dealerHand.push(drawFromShoe());
  playerHand.push(drawFromShoe());
  dealerHand.push(drawFromShoe());
  gameState = "playing";
  canDouble = true;

  updateDisplay();

  // Check for player blackjack
  if (handTotal(playerHand) === 21) {
    stand();
    return;
  }

  setGameMsg("Your turn: Hit, Stand, or Double.");
  updateDisplay();
}

function hit() {
  if (gameState !== "playing") return;
  playerHand.push(drawFromShoe());
  canDouble = false;
  if (handTotal(playerHand) > 21) {
    gameState = "done";
    bankroll = bankroll - currentBet;
    setGameMsg("Bust! You lose $" + currentBet + ".");
  }
  updateDisplay();
}

function stand() {
  if (gameState !== "playing") return;
  // Dealer plays — hits until 17 or more
  while (handTotal(dealerHand) < 17) {
    dealerHand.push(drawFromShoe());
  }
  var p = handTotal(playerHand);
  var d = handTotal(dealerHand);
  var msg;
  if (p === 21 && playerHand.length === 2) {
    // Natural blackjack pays 3:2
    var win = Math.floor(currentBet * 1.5);
    bankroll = bankroll + win;
    msg = "Blackjack! You win $" + win + ".";
  } else if (d > 21) {
    bankroll = bankroll + currentBet;
    msg = "Dealer busts. You win $" + currentBet + ".";
  } else if (p > d) {
    bankroll = bankroll + currentBet;
    msg = "You win $" + currentBet + ".";
  } else if (p < d) {
    bankroll = bankroll - currentBet;
    msg = "Dealer wins. You lose $" + currentBet + ".";
  } else {
    msg = "Push. Bet returned.";
  }
  gameState = "done";
  setGameMsg(msg);
  updateDisplay();
}

function doubleDown() {
  if (gameState !== "playing") return;
  if (!canDouble) {
    setGameMsg("Can only double on your first two cards.");
    return;
  }
  if (currentBet * 2 > bankroll) {
    setGameMsg("Not enough money to double.");
    return;
  }
  currentBet = currentBet * 2;
  playerHand.push(drawFromShoe());
  canDouble = false;
  if (handTotal(playerHand) > 21) {
    gameState = "done";
    bankroll = bankroll - currentBet;
    setGameMsg("Bust! You lose $" + currentBet + ".");
    updateDisplay();
    return;
  }
  stand();
}

function addCard(card) {
  runningCount = runningCount + cardValues[card];
  cardsSeen = cardsSeen + 1;
  history.push(card);
  updateDisplay();
}

function undo() {
  if (history.length === 0) return;
  var last = history.pop();
  runningCount = runningCount - cardValues[last];
  cardsSeen = cardsSeen - 1;
  updateDisplay();
}

function reset() {
  buildShoe(); // also clears count and history
  playerHand = [];
  dealerHand = [];
  gameState = "none";
  setGameMsg("New shoe. Place your bet.");
  updateDisplay();
}

function updateDisplay() {
  var decks = getDecks();
  var cardsTotal = decks * 52;
  var cardsLeft = cardsTotal - cardsSeen;
  if (cardsLeft < 0) cardsLeft = 0;
  var decksLeft = cardsLeft / 52;

  var trueCount = 0;
  if (decksLeft > 0) {
    trueCount = runningCount / decksLeft;
  }

  var betSuggest = "1 unit";
  if (trueCount >= 2 && trueCount < 3) {
    betSuggest = "2 units";
  } else if (trueCount >= 3 && trueCount < 4) {
    betSuggest = "4 units";
  } else if (trueCount >= 4 && trueCount < 5) {
    betSuggest = "6 units";
  } else if (trueCount >= 5) {
    betSuggest = "8 units";
  }

  document.getElementById("runningCount").innerText = runningCount;
  document.getElementById("trueCount").innerText = trueCount.toFixed(2);
  document.getElementById("bet").innerText = betSuggest;
  document.getElementById("cardsSeen").innerText = cardsSeen;
  document.getElementById("decksLeft").innerText = decksLeft.toFixed(2);

  if (history.length === 0) {
    document.getElementById("history").innerText = "No cards yet.";
  } else {
    var show = history.slice(-30);
    document.getElementById("history").innerText = show.join(", ");
  }

  // Game display
  document.getElementById("bankroll").innerText = bankroll;

  var hideDealer = (gameState === "playing");
  if (dealerHand.length === 0) {
    document.getElementById("dealerHand").innerText = "-";
  } else if (hideDealer) {
    document.getElementById("dealerHand").innerText = formatHand(dealerHand, true);
  } else {
    document.getElementById("dealerHand").innerText =
      formatHand(dealerHand, false) + "  (" + handTotal(dealerHand) + ")";
  }

  if (playerHand.length === 0) {
    document.getElementById("playerHand").innerText = "-";
  } else {
    document.getElementById("playerHand").innerText =
      formatHand(playerHand, false) + "  (" + handTotal(playerHand) + ")";
  }

  // Button states
  document.getElementById("dealBtn").disabled = (gameState === "playing");
  document.getElementById("hitBtn").disabled = (gameState !== "playing");
  document.getElementById("standBtn").disabled = (gameState !== "playing");
  document.getElementById("doubleBtn").disabled = (gameState !== "playing" || !canDouble);
}

// Wire up buttons
var cardButtons = document.getElementsByClassName("card-btn");
for (var i = 0; i < cardButtons.length; i++) {
  cardButtons[i].onclick = function() {
    addCard(this.getAttribute("data-card"));
  };
}

document.getElementById("undoBtn").onclick = undo;
document.getElementById("resetBtn").onclick = reset;
document.getElementById("deckCount").onchange = function() {
  buildShoe();
  playerHand = [];
  dealerHand = [];
  gameState = "none";
  setGameMsg("Deck count changed. New shoe built.");
  updateDisplay();
};
document.getElementById("dealBtn").onclick = deal;
document.getElementById("hitBtn").onclick = hit;
document.getElementById("standBtn").onclick = stand;
document.getElementById("doubleBtn").onclick = doubleDown;

buildShoe();
updateDisplay();
