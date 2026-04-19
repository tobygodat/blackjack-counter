# Blackjack Card Counter

A sleek, keyboard-friendly Hi-Lo blackjack card counter. Pure HTML/CSS/JS — no build step, no dependencies. Open `index.html` and play.

## Features

- **Hi-Lo running count** with a live true-count conversion (running ÷ decks remaining)
- **Deck penetration bar** with configurable shoe size (1–12 decks)
- **Bet-sizing guide** based on true count (1× → 8× ramp)
- **Practice mode** — cards flip at adjustable speed, guess the running count, get scored
- **Full keyboard support** — `2`–`9`, `0`/`T` for tens, `J` `Q` `K` `A`, `U` to undo, `R` for new shoe, `[` `]` to resize shoe

## Hi-Lo values

| Cards | Value |
|---|---|
| 2, 3, 4, 5, 6 | +1 |
| 7, 8, 9 | 0 |
| 10, J, Q, K, A | −1 |

## Run it

```bash
# Any static server works. For example:
python -m http.server 8000
# then open http://localhost:8000
```

Or just double-click `index.html`.

## Disclaimer

Training tool only. Not gambling advice. Card counting is legal but casinos may ask you to leave.
