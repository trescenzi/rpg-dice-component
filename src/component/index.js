import Die from '../die/die';

const styles = `
  :host {
    display: inline-block;
    font-family: sans;
  }

  #result {
    user-select: none;
    border: 3px solid white;
    border-radius: 3px;
    font-size: 2em;
    font-weight: bold;
    text-align: center;
    padding: 0.5em;
    width: 3em;
    height: 2.25em;
    box-sizing: border-box;
    display: block;
    line-height: 1.25;
    border: 3px solid lightgrey;
  }

  :host(.bad) #result {
    border: 3px solid tomato;
  }

  :host(.low) #result {
    border: 3px solid goldenrod;
  }

  :host(.ok) #result {
    border: 3px solid cadetblue;
  }

  :host(.great) #result {
    border: 3px solid mediumseagreen;
  }

  #roll {
    outline: none;
    margin-top: 1em;
    width: 100%;
    border: 1px solid lightgrey;
    font-size: 1rem;
    padding: 0.5em .25em;
  }
`;

const html = `
  <style>
    ${styles}
  </style>
  <div id="result">
    00
  </div>
  <button id="roll" type="button">
    Roll
  </button>
`;

const add = (x, y) => x + y;
const subtract = (x, y) => x - y;

function parseDiceString(diceString, randomPlus) {
  let tree = {
    operators: [],
    dice: [],
  }

  if (!diceString) {
    return tree;
  }

  tree = diceString.replace(/\s/, '')
    .split(/([\+-])/)
    .reduce((tree, curr) => {
      if (curr === '+') {
        tree.operators.push(add);
      } else if (curr === '-') {
        tree.operators.push(subtract);
      } else if (curr.indexOf('d') === -1 && parseInt(curr, 10)) {
        tree.dice.push(parseInt(curr, 10));
      } else if (curr.indexOf('d') !== 0) {
        const [numDice, sides] = curr.split('d');
        for (var i = 0; i<numDice; i++) {
          tree.dice.push(new Die(sides, randomPlus));
          tree.operators.push(add);
        }
      } else if (curr.indexOf('d') === 0) {
        tree.dice.push(new Die(curr.slice(0), randomPlus));
      } else {
        throw new Error(`BAD DIE STRING ${diceString} ${curr}`);
      }
      
      if (tree.operators.length !== tree.dice.length) {
        tree.operators.push(add);
      }

      return tree;
    }, tree);

  console.log(tree);
  return tree; 
}

const template = document.createRange().createContextualFragment(html);
console.log(template.cloneNode(true));
export default class RpgDiceComponent extends HTMLElement {
  static get observedAttributes() {
    return ['type', 'dice-string'];
  }

  constructor() {
    super();
    this.attachShadow({mode: 'open'});
    this.shadowRoot.append(template.cloneNode(true))

    this.resultsDiv = this.shadowRoot.querySelector('#result');
    this.rollButton = this.shadowRoot.querySelector('#roll');
    this.rollButton.addEventListener('click', () => {
      const results = this.roll();
      this.removeClasses();
      this.setResultClass(results);
      this.resultsDiv.innerText = results;
    });
  }

  removeClasses() {
    this.classList.remove('bad');
    this.classList.remove('low');
    this.classList.remove('ok');
    this.classList.remove('great');
  }

  setResultClass(result) {
    if (result < 7) {
      this.classList.add('bad');
    } else if (result < 11) {
      this.classList.add('low');
    } else if (result < 15) {
      this.classList.add('ok');
    } else {
      this.classList.add('great');
    }
  }

	roll() {
    return this.dice
      .map((d) => d.roll ? d.roll() : d)
      .reduce((acc, roll, i) => this.operators[i](acc,roll), 0)
	}

  buildDice() {
    const randomPlus = this.getAttribute('type') === 'randomplus';
    const {dice, operators} = parseDiceString(this.getAttribute('dice-string').toLowerCase(), randomPlus);
    this.dice = dice;
    this.operators = operators;
  }

  attributeChangedCallback() {
    this.buildDice();
  }
}