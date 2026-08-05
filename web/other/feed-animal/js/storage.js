var StorageManager=(function(){var STORAGE_KEY='feed-animal-save-v1';function getDefaultSave(){return{unlockedLevel:1,levels:{},settings:{music:true,sfx:true},animalFoods:null,difficultyBlocks:null,};}
function load(){try{var raw=localStorage.getItem(STORAGE_KEY);if(!raw)return getDefaultSave();var data=JSON.parse(raw);var def=getDefaultSave();if(!data||typeof data!=='object')return def;if(typeof data.unlockedLevel!=='number')data.unlockedLevel=def.unlockedLevel;if(!data.levels||typeof data.levels!=='object')data.levels={};if(!data.settings||typeof data.settings!=='object')data.settings=def.settings;if(typeof data.settings.music!=='boolean')data.settings.music=def.settings.music;if(typeof data.settings.sfx!=='boolean')data.settings.sfx=def.settings.sfx;if(!data.animalFoods||typeof data.animalFoods!=='object')data.animalFoods=null;if(!data.difficultyBlocks||!Array.isArray(data.difficultyBlocks))data.difficultyBlocks=null;return data;}catch(e){return getDefaultSave();}}
function save(data){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(data));}catch(e){}}
function getLevelData(levelId){var saveData=load();return saveData.levels[levelId]||null;}
function saveLevelResult(levelId,stars,score){var saveData=load();var prev=saveData.levels[levelId];var bestStars=prev?Math.max(prev.stars||0,stars):stars;var bestScore=prev?Math.max(prev.bestScore||0,score):score;saveData.levels[levelId]={stars:bestStars,bestScore:bestScore};if(stars>0&&levelId>=saveData.unlockedLevel&&levelId<GAME_CONFIG.MAX_LEVELS){saveData.unlockedLevel=levelId+1;}
save(saveData);}
function isLevelUnlocked(levelId){return levelId<=load().unlockedLevel;}
function getUnlockedLevel(){return load().unlockedLevel;}
function getSettings(){return load().settings;}
function updateSettings(key,value){var saveData=load();saveData.settings[key]=value;save(saveData);}
function getAnimalFoods(){return load().animalFoods;}
function saveAnimalFoods(animalFoods){var saveData=load();saveData.animalFoods=animalFoods;save(saveData);}
function getDifficultyBlocks(){return load().difficultyBlocks;}
function saveDifficultyBlocks(blocks){var saveData=load();saveData.difficultyBlocks=blocks;save(saveData);}
function resetProgress(){localStorage.removeItem(STORAGE_KEY);}
return{load:load,save:save,getLevelData:getLevelData,saveLevelResult:saveLevelResult,isLevelUnlocked:isLevelUnlocked,getUnlockedLevel:getUnlockedLevel,getSettings:getSettings,updateSettings:updateSettings,getAnimalFoods:getAnimalFoods,saveAnimalFoods:saveAnimalFoods,getDifficultyBlocks:getDifficultyBlocks,saveDifficultyBlocks:saveDifficultyBlocks,resetProgress:resetProgress,};})();