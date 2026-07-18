
(function(){
  function removeGlobalStatsPanel(){
    try{
      var panel = document.getElementById('admin-global-stats-panel');
      if(panel) panel.remove();
    }catch(e){}
  }
  removeGlobalStatsPanel();
  document.addEventListener('DOMContentLoaded', removeGlobalStatsPanel);
  if(window.schoolhubDebouncedRescan){ window.schoolhubDebouncedRescan('removeGlobalStatsPanel', removeGlobalStatsPanel, 3000); }
  else { setInterval(removeGlobalStatsPanel, 800); }
})();
