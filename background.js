Array.prototype.selectGroup = function(originIndex, predicate) {
  let origin = this[originIndex]

  if (!predicate(origin)) {
    return []
  }

  let result = [origin]

  let leftIndex = originIndex - 1
  let left = this[leftIndex]

  while (left && predicate(left)) {
    result.unshift(left)
    leftIndex -= 1
    left = this[leftIndex]
  }

  let rightIndex = originIndex + 1
  let right = this[rightIndex]

  while (right && predicate(right)) {
    result.push(right)
    rightIndex += 1
    right = this[rightIndex]
  }

  return result
}

async function multiselectTabs(direction) {
  let currentWindowTabs = await chrome.tabs.query({
    currentWindow: true
  })

  let [activeTab] = await chrome.tabs.query({
    currentWindow: true,
    active: true
  })

  if (direction == 'group') {

    let selectedTabs = currentWindowTabs.selectGroup(activeTab.index,
      tab => tab.pinned === activeTab.pinned && tab.groupId === activeTab.groupId)
    console.debug("selectedTabs " + JSON.stringify(selectedTabs.map(tab => tab.index)))

    return chrome.tabs.highlight({
      tabs: selectedTabs.slice().map(tab => tab.index)
    })
  }

  // --- determin selection group ----------------------------------------------
  let selectedTabs = currentWindowTabs.selectGroup(activeTab.index, tab => tab.highlighted)
  console.debug("selectedTabs " + JSON.stringify(selectedTabs.map(tab => tab.index)))

  let leftSelectedTab = selectedTabs[0]
  let rightSelectedTab = selectedTabs[selectedTabs.length - 1]

  // ---------------------------------------------------------------------------

  if (direction == 'left') {
    if (selectedTabs.length > 1 && rightSelectedTab.id == activeTab.id) {
      console.debug("deselect right");
      selectedTabs.pop()
      return chrome.tabs.highlight({
        tabs: selectedTabs.slice().reverse().map(tab => tab.index)
      })
    }

    let leftTab = currentWindowTabs[leftSelectedTab.index - 1]
    if (leftTab) {
      console.debug("select left");
      selectedTabs.unshift(leftTab)
      return chrome.tabs.highlight({
        tabs: selectedTabs.map(tab => tab.index)
      })
    }
    return
  }

  if (direction == 'right') {
    if (selectedTabs.length > 1 && leftSelectedTab.id == activeTab.id) {
      console.debug("deselect left");
      selectedTabs.shift()
      return chrome.tabs.highlight({
        tabs: selectedTabs.map(tab => tab.index)
      })
    }

    let rightTab = currentWindowTabs[rightSelectedTab.index + 1]
    if (rightTab) {
      console.debug("select right");
      selectedTabs.push(rightTab)
      return chrome.tabs.highlight({
        tabs: selectedTabs.slice().reverse().map(tab => tab.index)
      })
    }
    return
  }
}

// -----------------------------------------------------------------------------

chrome.commands.onCommand.addListener(async (command) => {
  console.debug(`command: ${command}`)
  switch (command) {
    case 'multiselect-tab-left':
    case 'multiselect-tab-right':
    case 'multiselect-tab-group':
      return multiselectTabs(command.replace('multiselect-tab-', ''))
  }
})