const BASE_API_URL = "https://jservice.io/api/";
const NUM_CATEGORIES = 6;
const NUM_CLUES_PER_CAT = 5;

// categories is the main data structure for the app; it looks like this:

//  [
//    { title: "Math",
//      clues: [
//        {question: "2+2", answer: 4, showing: null},
//        {question: "1+1", answer: 2, showing: null}
//        ...
//      ],
//    },
//    { title: "Literature",
//      clues: [
//        {question: "Hamlet Author", answer: "Shakespeare", showing: null},
//        {question: "Bell Jar Author", answer: "Plath", showing: null},
//        ...
//      ],
//    },
//    ...
//  ]

let categories = [];

/** Get NUM_CATEGORIES random category from API.
 * 
 * Returns array of category ids
 */

async function getCategoryIds() {
  let response = await axios.get(`${BASE_API_URL}categories?count=100`);
  let catIds = response.data.map(category => category.id);
  return _.sampleSize(catIds, NUM_CATEGORIES);
}
  
/** Return object with data about a category:
 *
 *  Returns { title: "Math", clues: clue-array }
 *
 * Where clue-array is:
 *   [
 *      {question: "Hamlet Author", answer: "Shakespeare", showing: null},
 *      {question: "Bell Jar Author", answer: "Plath", showing: null},
 *      ...
 *   ]
 */

async function getCategory(catId) {
    try {
      let response = await axios.get(`${BASE_API_URL}categories/${catId}/clues`);
      let categoryData = response.data;
  
      // Extract category title
      let title = categoryData.title;
  
      // Extract clues and format them as required
      let clues = categoryData.clues.map(clue => ({
        question: clue.question,
        answer: clue.answer,
        showing: null
      }));
  
      // Return the object with category data
      return {
        title: title,
        clues: clues
      };
    } catch (error) {
      console.error(error);
      throw new Error('Failed to retrieve category data');
  }
}
  

/** Fill the HTML table#jeopardy with the categories & cells for questions.
 *
 * - The <thead> should be filled w/a <tr>, and a <td> for each category
 * - The <tbody> should be filled w/NUM_QUESTIONS_PER_CAT <tr>s,
 *   each with a question for each category in a <td>
 *   (initally, just show a "?" where the question/answer would go.)
 */

async function fillTable() {
    try {
      // Get category IDs
      let categoryIds = await getCategoryIds();
  
      // Get category data for each ID
      let categoryPromises = categoryIds.map(catId => getCategory(catId));
      categories = await Promise.all(categoryPromises);
  
      // Get table element
      let table = document.querySelector('table#jeopardy');
  
      // Create table header row
      let thead = table.createTHead();
      let headerRow = thead.insertRow();
      categories.forEach(category => {
        let headerCell = document.createElement('th');
        headerCell.textContent = category.title;
        headerRow.appendChild(headerCell);
    });
  
      // Create table body rows
      let tbody = table.createTBody();
      for (let i = 0; i < NUM_CLUES_PER_CAT; i++) {
        let bodyRow = tbody.insertRow();
        categories.forEach(category => {
          let bodyCell = bodyRow.insertCell();
          let questionCell = document.createElement('span');
          questionCell.textContent = '?';
          bodyCell.appendChild(questionCell);
        });
      }
    } catch (error) {
      console.error(error);
      // Handle error as needed
  }
}
  
/** Handle clicking on a clue: show the question or answer.
 *
 * Uses .showing property on clue to determine what to show:
 * - if currently null, show question & set .showing to "question"
 * - if currently "question", show answer & set .showing to "answer"
 * - if currently "answer", ignore click
 * */

function handleClick(evt) {
    // Get the clicked clue element
    let clueElement = evt.target;
  
    // Get the clue object associated with the clicked element
    let clue = clueElement.clue;
  
    // Get the current showing state of the clue
    let showing = clue.showing;
  
    // Toggle between question and answer based on the current showing state
    if (showing === null) {
      // Show the question
      clueElement.textContent = clue.question;
      clue.showing = "question";
    } else if (showing === "question") {
      // Show the answer
      clueElement.textContent = clue.answer;
      clue.showing = "answer";
    }
    // Ignore click if showing is already "answer"
}


/** Wipe the current Jeopardy board, show the loading spinner,
 * and update the button used to fetch data.
 */

function showLoadingView() {
    // Wipe the current Jeopardy board
    let jeopardyTable = document.querySelector('table#jeopardy');
    jeopardyTable.innerHTML = '';
  
    // Show the loading spinner
    let loadingSpinner = document.querySelector('.loading-spinner');
    loadingSpinner.style.display = 'block';

  //   // Show the loading spinner
  //   let loadingSpinner = document.querySelector('.loading-spinner');
  //   if (loadingSpinner) {
  //     loadingSpinner.style.display = 'block';
  //   } else {
  // // Handle the case when loadingSpinner is null
  //   console.error('Loading spinner element not found.');
  //   }
    // Update the fetch data button
    let fetchDataButton = document.querySelector('#fetch-data-button');
    fetchDataButton.disabled = true;
    fetchDataButton.textContent = 'Loading...';
}
  

/** Remove the loading spinner and update the button used to fetch data. */

function hideLoadingView() {
    // Hide the loading spinner
    let loadingSpinner = document.querySelector('.loading-spinner');
    loadingSpinner.style.display = 'none';
  
    // Update the fetch data button
    let fetchDataButton = document.querySelector('#fetch-data-button');
    fetchDataButton.disabled = false;
    fetchDataButton.textContent = 'Fetch Data';
}

/** Start game:
 *
 * - get random category Ids
 * - get data for each category
 * - create HTML table
 * */

async function setupAndStart() {
    try {
      // Remove the loading spinner and update the button
      hideLoadingView();
  
      // Get random category IDs
      let categoryIds = await getCategoryIds();
  
      // Get data for each category
      let categoryPromises = categoryIds.map(catId => getCategory(catId));
      let categories = await Promise.all(categoryPromises);
  
      // Create HTML table
      fillTable(categories);
    } catch (error) {
      console.error(error);
      // Handle error as needed
    }
}

/** On click of start / restart button, set up game. */
document.getElementById('restart').addEventListener('click', function() {
    startGame();
  });
  
  // Function to start the game
  function startGame() {
    showLoadingView();
    setupAndStart();
}
  
/** On page load, add event handler for clicking clues */

// Event listener for the "DOMContentLoaded" event
document.addEventListener('DOMContentLoaded', function() {
    addClueClickHandler();
  });
  
  // Function to add event handler for clicking clues
  function addClueClickHandler() {
    const clues = document.querySelectorAll('.clue');
    clues.forEach(clue => {
      clue.addEventListener('click', function() {
        handleClick(this);
      });
    });
}