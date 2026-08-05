var GameManager=(function(){var STATE={MENU:'menu',PLAYING:'playing',ANIMATING:'animating',LEVEL_COMPLETE:'levelComplete'};var state=STATE.MENU;var currentLevelId=0;var currentLevelData=null;var score=0;var combo=0;var correctCount=0;var wrongCount=0;var targetCount=0;var currentFoodOptions=[];var isInputLocked=false;function getState(){return state;}
function startLevel(levelId){var animalFoods=StorageManager.getAnimalFoods();var difficultyBlocks=StorageManager.getDifficultyBlocks();var level=generateLevel(levelId,animalFoods,difficultyBlocks);if(!level)return false;currentLevelId=levelId;currentLevelData=level;score=0;combo=0;correctCount=0;wrongCount=0;targetCount=level.targetCount;isInputLocked=false;currentFoodOptions=level.optionFoodIds.slice();state=STATE.PLAYING;return true;}
function getCurrentLevelData(){return currentLevelData;}
function getCurrentLevelId(){return currentLevelId;}
function getScore(){return score;}
function getCombo(){return combo;}
function getCorrectCount(){return correctCount;}
function getWrongCount(){return wrongCount;}
function getTargetCount(){return targetCount;}
function getFoodOptions(){return currentFoodOptions;}
function isLocked(){return isInputLocked;}
function handleDrop(foodId){if(state!==STATE.PLAYING||isInputLocked)return null;var correctFoods=currentLevelData.correctFoodIds;var isCorrect=false;for(var i=0;i<correctFoods.length;i++){if(correctFoods[i]===foodId){isCorrect=true;break;}}
if(isCorrect){correctCount++;combo++;var bonusPoints=combo>=6?20:combo>=3?15:10;score+=bonusPoints;var encourage=null;if(combo===3)encourage=_randomPick(GAME_CONFIG.ENCOURAGE_COMBO_3);else if(combo===6)encourage=_randomPick(GAME_CONFIG.ENCOURAGE_COMBO_6);return{result:'correct',score:score,combo:combo,correctCount:correctCount,targetCount:targetCount,bonus:bonusPoints,encourage:encourage,animalId:currentLevelData.animalId};}else{wrongCount++;combo=0;return{result:'wrong',score:score,combo:combo,correctCount:correctCount,wrongCount:wrongCount,targetCount:targetCount};}}
function handleDropOutside(){combo=0;return{result:'outside',combo:combo};}
function isLevelComplete(){return correctCount>=targetCount;}
function calculateStars(){if(wrongCount===0)return 3;if(wrongCount<=2)return 2;return 1;}
function completeLevel(){var stars=calculateStars();state=STATE.LEVEL_COMPLETE;StorageManager.saveLevelResult(currentLevelId,stars,score);return{stars:stars,score:score,levelId:currentLevelId};}
function nextLevel(){var nextId=currentLevelId+1;if(nextId>GAME_CONFIG.MAX_LEVELS){state=STATE.MENU;return null;}
if(!startLevel(nextId)){state=STATE.MENU;return null;}
return currentLevelData;}
function goToMenu(){state=STATE.MENU;currentLevelData=null;currentLevelId=0;}
function lockInput(){isInputLocked=true;}
function unlockInput(){isInputLocked=false;}
function setAnimating(isAnimating){if(isAnimating){state=STATE.ANIMATING;}else{state=isLevelComplete()?STATE.LEVEL_COMPLETE:STATE.PLAYING;}}
function _randomPick(arr){return arr[Math.floor(Math.random()*arr.length)];}
return{STATE:STATE,getState:getState,startLevel:startLevel,getCurrentLevelData:getCurrentLevelData,getCurrentLevelId:getCurrentLevelId,getScore:getScore,getCombo:getCombo,getCorrectCount:getCorrectCount,getWrongCount:getWrongCount,getTargetCount:getTargetCount,getFoodOptions:getFoodOptions,isLocked:isLocked,handleDrop:handleDrop,handleDropOutside:handleDropOutside,isLevelComplete:isLevelComplete,calculateStars:calculateStars,completeLevel:completeLevel,nextLevel:nextLevel,goToMenu:goToMenu,lockInput:lockInput,unlockInput:unlockInput,setAnimating:setAnimating,};})();