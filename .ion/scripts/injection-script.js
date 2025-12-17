/**
 * Ion Injection Script
 * Handles element selection and communication with parent window via postMessage
 * This script is injected into the iframe running the React app
 */

(function () {
  'use strict';

  // ============================================
  // Configuration
  // ============================================

  const ATTRIBUTE_NAME = 'data-ion-id';
  const CALLER_ATTRIBUTE_NAME = 'data-ion-caller-id';

  // State machine states
  const STATE = {
    DEFAULT: 'DEFAULT',
    SELECT: 'SELECT',
    SELECTED: 'SELECTED',
  };

  // ============================================
  // State
  // ============================================

  let currentState = STATE.DEFAULT;
  let selectedElement = null;
  let selectedNodeId = null;
  let hoveredElement = null;
  let selectionOverlay = null;
  let hoverOverlay = null;
  let originalStyles = new Map();

  // ============================================
  // Communication Layer (postMessage)
  // ============================================

  function sendEvent(channel, data) {
    try {
      window.parent.postMessage({ channel, data, source: 'ion-injection' }, '*');
    } catch (error) {
      console.error('[Ion] Failed to send event:', channel, error);
    }
  }

  function receiveEvent(channel, callback) {
    window.addEventListener('message', (event) => {
      if (event.data && event.data.channel === channel) {
        callback(event.data.data);
      }
    });
  }

  // ============================================
  // Utility Functions
  // ============================================

  function decodeNodeInfo(encodedInfo) {
    try {
      const json = atob(encodedInfo);
      return JSON.parse(json);
    } catch (error) {
      console.error('[Ion] Failed to decode node info:', error);
      return null;
    }
  }

  function findElementsWithSameId(nodeId) {
    return Array.from(document.querySelectorAll(`[${ATTRIBUTE_NAME}="${nodeId}"]`));
  }

  function getCallStack(element) {
    const stack = [];
    let current = element;

    while (current && current !== document.body) {
      const callerId = current.getAttribute(CALLER_ATTRIBUTE_NAME);
      if (callerId) {
        const callerInfo = decodeNodeInfo(callerId);
        if (callerInfo && callerInfo.caller) {
          stack.push(callerInfo.caller);
        }
      }
      current = current.parentElement;
    }

    return stack;
  }

  function getElementStyles(element) {
    const computed = window.getComputedStyle(element);
    const styles = {};

    const properties = [
      'color', 'backgroundColor', 'fontSize', 'fontFamily', 'fontWeight',
      'lineHeight', 'letterSpacing', 'textAlign', 'textDecoration',
      'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
      'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
      'border', 'borderRadius', 'borderColor', 'borderWidth', 'borderStyle',
      'width', 'height', 'maxWidth', 'maxHeight', 'minWidth', 'minHeight',
      'display', 'position', 'top', 'right', 'bottom', 'left',
      'flexDirection', 'justifyContent', 'alignItems', 'gap',
      'gridTemplateColumns', 'gridTemplateRows', 'gridGap',
      'opacity', 'visibility', 'overflow', 'zIndex', 'boxShadow', 'transform', 'transition',
    ];

    properties.forEach((prop) => {
      styles[prop] = computed.getPropertyValue(prop.replace(/([A-Z])/g, '-$1').toLowerCase());
    });

    return styles;
  }

  function detectThemeMode() {
    const bodyBg = window.getComputedStyle(document.body).backgroundColor;
    const rgb = bodyBg.match(/\d+/g);
    if (rgb) {
      const brightness = (parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000;
      return brightness < 128 ? 'dark' : 'light';
    }
    return 'light';
  }

  function hasTextContent(element) {
    for (const node of element.childNodes) {
      if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
        return true;
      }
    }
    return false;
  }

  // ============================================
  // Overlay Management
  // ============================================

  function createOverlay(type) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      pointer-events: none;
      z-index: 999999;
      border: 2px solid ${type === 'selection' ? '#0066ff' : '#00cc66'};
      background: ${type === 'selection' ? 'rgba(0, 102, 255, 0.1)' : 'rgba(0, 204, 102, 0.1)'};
      transition: all 0.1s ease-out;
    `;
    overlay.dataset.ionOverlay = type;
    document.body.appendChild(overlay);
    return overlay;
  }

  function updateOverlayPosition(overlay, element) {
    if (!overlay || !element) return;

    const rect = element.getBoundingClientRect();
    overlay.style.top = rect.top + 'px';
    overlay.style.left = rect.left + 'px';
    overlay.style.width = rect.width + 'px';
    overlay.style.height = rect.height + 'px';
  }

  function showSelectionOverlay(element) {
    if (!selectionOverlay) {
      selectionOverlay = createOverlay('selection');
    }
    updateOverlayPosition(selectionOverlay, element);
    selectionOverlay.style.display = 'block';
  }

  function hideSelectionOverlay() {
    if (selectionOverlay) {
      selectionOverlay.style.display = 'none';
    }
  }

  function showHoverOverlay(element) {
    if (!hoverOverlay) {
      hoverOverlay = createOverlay('hover');
    }
    updateOverlayPosition(hoverOverlay, element);
    hoverOverlay.style.display = 'block';
  }

  function hideHoverOverlay() {
    if (hoverOverlay) {
      hoverOverlay.style.display = 'none';
    }
  }

  function removeAllOverlays() {
    hideSelectionOverlay();
    hideHoverOverlay();
  }

  // ============================================
  // State Machine Transitions
  // ============================================

  function transitionTo(newState, data = {}) {
    const oldState = currentState;
    currentState = newState;

    console.log(`[Ion] State transition: ${oldState} -> ${newState}`);

    switch (newState) {
      case STATE.DEFAULT:
        removeAllOverlays();
        selectedElement = null;
        selectedNodeId = null;
        hoveredElement = null;
        break;

      case STATE.SELECT:
        if (data.preserveSelection && selectedElement) {
          showSelectionOverlay(selectedElement);
        } else {
          hideSelectionOverlay();
          selectedElement = null;
          selectedNodeId = null;
        }
        break;

      case STATE.SELECTED:
        if (data.element) {
          selectedElement = data.element;
          selectedNodeId = data.nodeId;
          showSelectionOverlay(selectedElement);
        }
        hideHoverOverlay();
        hoveredElement = null;
        break;
    }
  }

  // ============================================
  // Event Handlers
  // ============================================

  function handleClick(event) {
    if (currentState !== STATE.SELECT) return;

    const target = event.target.closest(`[${ATTRIBUTE_NAME}]`);
    if (!target) return;

    event.preventDefault();
    event.stopPropagation();

    const nodeId = target.getAttribute(ATTRIBUTE_NAME);
    const nodeInfo = decodeNodeInfo(nodeId);

    if (!nodeInfo) {
      console.error('[Ion] Could not decode node info for element');
      return;
    }

    const callerAttr = target.getAttribute(CALLER_ATTRIBUTE_NAME);
    const callerInfo = callerAttr ? decodeNodeInfo(callerAttr) : null;
    const callStack = getCallStack(target);
    const sameElements = findElementsWithSameId(nodeId);
    const elementIndex = sameElements.indexOf(target);

    transitionTo(STATE.SELECTED, { element: target, nodeId });

    sendEvent('select-node', {
      nodeInfo,
      callerInfo,
      callStack,
      clickPos: { x: event.clientX, y: event.clientY },
      totalElements: sameElements.length,
      elementIndex,
      tagName: target.tagName.toLowerCase(),
      rawDataIonId: target.getAttribute(ATTRIBUTE_NAME),
      rawDataIonCallerId: target.getAttribute(CALLER_ATTRIBUTE_NAME),
    });

    sendCurrentStyles('click');
  }

  function handleMouseMove(event) {
    if (currentState !== STATE.SELECT) return;

    const target = event.target.closest(`[${ATTRIBUTE_NAME}]`);

    if (target === hoveredElement) return;

    hoveredElement = target;

    if (target) {
      showHoverOverlay(target);
    } else {
      hideHoverOverlay();
    }
  }

  function handleScrollOrResize() {
    if (selectedElement) {
      updateOverlayPosition(selectionOverlay, selectedElement);
    }
    if (hoveredElement && currentState === STATE.SELECT) {
      updateOverlayPosition(hoverOverlay, hoveredElement);
    }
  }

  function handleDoubleClick(event) {
    if (currentState !== STATE.SELECTED || !selectedElement) return;

    if (!hasTextContent(selectedElement)) return;

    event.preventDefault();
    event.stopPropagation();

    selectedElement.contentEditable = 'true';
    selectedElement.focus();

    const range = document.createRange();
    range.selectNodeContents(selectedElement);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    const finishEditing = () => {
      selectedElement.contentEditable = 'false';
      selectedElement.removeEventListener('blur', finishEditing);
      selectedElement.removeEventListener('keydown', handleEditKeydown);

      const newText = selectedElement.textContent;
      const nodeId = selectedElement.getAttribute(ATTRIBUTE_NAME);

      sendEvent('text-content-updated', {
        nodeId,
        text: newText,
        totalElements: findElementsWithSameId(nodeId).length,
        success: true,
      });
    };

    const handleEditKeydown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        selectedElement.blur();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        selectedElement.contentEditable = 'false';
        selectedElement.removeEventListener('blur', finishEditing);
        selectedElement.removeEventListener('keydown', handleEditKeydown);

        sendEvent('text-content-updated', {
          nodeId: selectedElement.getAttribute(ATTRIBUTE_NAME),
          text: selectedElement.textContent,
          success: false,
          cancelled: true,
        });
      }
    };

    selectedElement.addEventListener('blur', finishEditing);
    selectedElement.addEventListener('keydown', handleEditKeydown);
  }

  function handleKeydown(event) {
    const keyData = {
      key: event.key,
      code: event.code,
      metaKey: event.metaKey,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
    };

    if (event.key === 'Escape') {
      event.preventDefault();
      if (currentState === STATE.SELECTED) {
        transitionTo(STATE.SELECT, { preserveSelection: false });
        sendEvent('key-pressed', { ...keyData, action: 'deselect' });
      } else if (currentState === STATE.SELECT) {
        transitionTo(STATE.DEFAULT);
        sendEvent('key-pressed', { ...keyData, action: 'exit-select-mode' });
      }
    }
  }

  function sendCurrentStyles(reason = 'update') {
    if (!selectedElement) return;

    const nodeId = selectedElement.getAttribute(ATTRIBUTE_NAME);
    const nodeInfo = decodeNodeInfo(nodeId);
    const callerAttr = selectedElement.getAttribute(CALLER_ATTRIBUTE_NAME);
    const callerInfo = callerAttr ? decodeNodeInfo(callerAttr) : null;
    const callStack = getCallStack(selectedElement);

    sendEvent('current-node-styles', {
      id: nodeId,
      hasText: hasTextContent(selectedElement),
      tagName: selectedElement.tagName.toLowerCase(),
      styles: getElementStyles(selectedElement),
      nodeInfo,
      callerInfo,
      callStack,
      themeMode: detectThemeMode(),
      reason,
      totalElements: findElementsWithSameId(nodeId).length,
    });
  }

  // ============================================
  // Message Handlers (from parent)
  // ============================================

  receiveEvent('enter-select-mode', (data) => {
    console.log('[Ion] Received enter-select-mode', data);
    transitionTo(STATE.SELECT, { preserveSelection: data?.preserveSelection });
  });

  receiveEvent('reset-state', () => {
    console.log('[Ion] Received reset-state');
    transitionTo(STATE.DEFAULT);
  });

  receiveEvent('enter-selected-state', () => {
    console.log('[Ion] Received enter-selected-state');
    if (selectedElement) {
      transitionTo(STATE.SELECTED, { element: selectedElement, nodeId: selectedNodeId });
    }
  });

  receiveEvent('highlight-node', (data) => {
    const { nodeId, color } = data;
    const elements = findElementsWithSameId(nodeId);

    elements.forEach((el) => {
      originalStyles.set(el, el.style.outline);
      el.style.outline = `2px solid ${color || '#ff6600'}`;
    });
  });

  receiveEvent('stop-highlighting-node', (data) => {
    const { nodeId } = data;
    const elements = findElementsWithSameId(nodeId);

    elements.forEach((el) => {
      const original = originalStyles.get(el);
      el.style.outline = original || '';
      originalStyles.delete(el);
    });
  });

  receiveEvent('update-node-style', (data) => {
    const { nodeId, styles } = data;
    const elements = findElementsWithSameId(nodeId);

    elements.forEach((el, index) => {
      if (!originalStyles.has(el)) {
        originalStyles.set(el, el.style.cssText);
      }
      Object.entries(styles).forEach(([prop, value]) => {
        el.style[prop] = value;
      });
    });

    if (selectedElement && elements.includes(selectedElement)) {
      updateOverlayPosition(selectionOverlay, selectedElement);
    }
  });

  receiveEvent('reset-node-style', (data) => {
    const { nodeId } = data;
    const elements = findElementsWithSameId(nodeId);

    elements.forEach((el) => {
      const original = originalStyles.get(el);
      if (original !== undefined) {
        el.style.cssText = original;
        originalStyles.delete(el);
      }
    });

    if (selectedElement && elements.includes(selectedElement)) {
      updateOverlayPosition(selectionOverlay, selectedElement);
    }
  });

  receiveEvent('update-node-text', (data) => {
    const { nodeId, text, elementIndex } = data;
    const elements = findElementsWithSameId(nodeId);

    if (elementIndex !== undefined && elements[elementIndex]) {
      elements[elementIndex].textContent = text;
    } else {
      elements.forEach((el) => {
        el.textContent = text;
      });
    }
  });

  receiveEvent('discard-text-edit', () => {
    if (selectedElement && selectedElement.contentEditable === 'true') {
      selectedElement.contentEditable = 'false';
    }
  });

  // ============================================
  // Node Comment Support
  // ============================================

  function findElementByAnchor(anchor) {
    const { dataIonId, dataIonCallerId } = anchor;

    const candidates = document.querySelectorAll(`[${ATTRIBUTE_NAME}="${dataIonId}"]`);

    for (const el of candidates) {
      const callerId = el.getAttribute(CALLER_ATTRIBUTE_NAME);

      if (dataIonCallerId === null && !callerId) {
        return el;
      }
      if (callerId === dataIonCallerId) {
        return el;
      }
    }

    return null;
  }

  function getElementBounds(element) {
    const rect = element.getBoundingClientRect();
    return {
      top: rect.top,
      left: rect.left,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
    };
  }

  receiveEvent('get-node-comment-positions', (data) => {
    const { anchors } = data;

    const positions = anchors.map(({ id, anchor }) => {
      const element = findElementByAnchor(anchor);

      if (!element) {
        return { id, found: false };
      }

      return {
        id,
        found: true,
        bounds: getElementBounds(element),
      };
    });

    sendEvent('node-comment-positions', { positions });
  });

  let positionUpdateScheduled = false;
  function schedulePositionUpdate() {
    if (positionUpdateScheduled) return;
    positionUpdateScheduled = true;

    requestAnimationFrame(() => {
      positionUpdateScheduled = false;
      sendEvent('node-positions-changed', {});
    });
  }

  receiveEvent('highlight-comment-node', (data) => {
    const { anchor, color = 'rgba(59, 130, 246, 0.3)' } = data;
    const element = findElementByAnchor(anchor);

    if (element) {
      if (!originalStyles.has(element)) {
        originalStyles.set(element, {
          outline: element.style.outline,
          outlineOffset: element.style.outlineOffset,
        });
      }
      element.style.outline = `2px solid ${color}`;
      element.style.outlineOffset = '2px';
    }
  });

  receiveEvent('unhighlight-comment-node', (data) => {
    const { anchor } = data;
    const element = findElementByAnchor(anchor);

    if (element) {
      const original = originalStyles.get(element);
      if (original && typeof original === 'object') {
        element.style.outline = original.outline || '';
        element.style.outlineOffset = original.outlineOffset || '';
        originalStyles.delete(element);
      }
    }
  });

  // ============================================
  // Navigation Tracking
  // ============================================

  function setupNavigationTracking() {
    let lastUrl = window.location.href;

    const observer = new MutationObserver(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        sendEvent('did-navigate-in-page', { url: lastUrl });
        transitionTo(STATE.DEFAULT);
      }
    });

    observer.observe(document, { subtree: true, childList: true });

    window.addEventListener('popstate', () => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        sendEvent('did-navigate-in-page', { url: lastUrl });
        transitionTo(STATE.DEFAULT);
      }
    });
  }

  // ============================================
  // Initialization
  // ============================================

  function initialize() {
    console.log('[Ion] Injection script initializing...');

    document.addEventListener('click', handleClick, true);
    document.addEventListener('mousemove', handleMouseMove, true);
    document.addEventListener('dblclick', handleDoubleClick, true);
    document.addEventListener('keydown', handleKeydown, true);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    window.addEventListener('scroll', schedulePositionUpdate, { passive: true, capture: true });
    window.addEventListener('resize', schedulePositionUpdate, { passive: true });

    const positionObserver = new MutationObserver(schedulePositionUpdate);
    positionObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
    });

    setupNavigationTracking();

    sendEvent('ion-injection-ready', {
      url: window.location.href,
      timestamp: Date.now(),
    });

    console.log('[Ion] Injection script ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();
