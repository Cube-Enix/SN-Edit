/* inserted by pull.js */
import _twAsset0 from "!url-loader!./icons/close.svg";
import _twAsset1 from "!url-loader!./icons/debug-unread.svg";
import _twAsset2 from "!url-loader!./icons/debug.svg";
import _twAsset3 from "!url-loader!./icons/delete.svg";
import _twAsset4 from "!url-loader!./icons/download-white.svg";
import _twAsset5 from "!url-loader!./icons/error.svg";
import _twAsset6 from "!url-loader!./icons/logs.svg";
import _twAsset7 from "!url-loader!./icons/performance.svg";
import _twAsset8 from "!url-loader!./icons/play.svg";
import _twAsset9 from "!url-loader!./icons/step.svg";
import _twAsset10 from "!url-loader!./icons/subthread.svg";
import _twAsset11 from "!url-loader!./icons/threads.svg";
import _twAsset12 from "!url-loader!./icons/warning.svg";
const _twGetAsset = (path) => {
  if (path === "/icons/close.svg") return _twAsset0;
  if (path === "/icons/debug-unread.svg") return _twAsset1;
  if (path === "/icons/debug.svg") return _twAsset2;
  if (path === "/icons/delete.svg") return _twAsset3;
  if (path === "/icons/download-white.svg") return _twAsset4;
  if (path === "/icons/error.svg") return _twAsset5;
  if (path === "/icons/logs.svg") return _twAsset6;
  if (path === "/icons/performance.svg") return _twAsset7;
  if (path === "/icons/play.svg") return _twAsset8;
  if (path === "/icons/step.svg") return _twAsset9;
  if (path === "/icons/subthread.svg") return _twAsset10;
  if (path === "/icons/threads.svg") return _twAsset11;
  if (path === "/icons/warning.svg") return _twAsset12;
  throw new Error(`Unknown asset: ${path}`);
};

import { getRunningThread } from "./module.js";
import LogView from "./log-view.js";

const concatInPlace = (copyInto, copyFrom) => {
  for (const i of copyFrom) {
    copyInto.push(i);
  }
};

export default async function createThreadsTab({ debug, addon, console, msg }) {
  const vm = addon.tab.traps.vm;

  const tab = debug.createHeaderTab({
    text: msg("tab-threads"),
    icon: _twGetAsset("/icons/threads.svg"),
  });

  const logView = new LogView();
  logView.canAutoScrollToEnd = false;
  logView.outerElement.classList.add("sa-debugger-threads");
  logView.placeholderElement.textContent = msg("no-threads-running");

  logView.generateRow = (row) => {
    const root = document.createElement("div");
    root.className = "sa-debugger-log";

    const isHeader = row.type === "thread-header";
    const indenter = document.createElement("div");
    indenter.className = "sa-debugger-thread-indent";
    indenter.style.setProperty("--level", isHeader ? row.depth : row.depth + 1);
    root.appendChild(indenter);

    if (isHeader) {
      root.classList.add("sa-debugger-thread-title");

      if (row.depth > 0) {
        const icon = document.createElement("div");
        icon.className = "sa-debugger-log-icon";
        root.appendChild(icon);
      }

      const name = document.createElement("div");
      name.textContent = row.targetName;
      name.className = "sa-debugger-thread-target-name";
      root.appendChild(name);

      const id = document.createElement("div");
      id.className = "sa-debugger-thread-id";
      id.textContent = msg("thread", {
        id: row.id,
      });
      root.appendChild(id);
    }

    if (row.type === "thread-stack") {
      const preview = debug.createBlockPreview(row.targetId, row.blockId);
      if (preview) {
        root.appendChild(preview);
      }
    }

    if (row.type === "compiled") {
      const el = document.createElement('div');
      el.className = "sa-debugger-thread-compiled";
      el.textContent = "Stack information not available for compiled threads.";
      root.appendChild(el);
    }

    if (row.targetId && row.blockId) {
      root.appendChild(debug.createBlockLink(row.targetId, row.blockId));
    }

    return {
      root,
    };
  };

  logView.renderRow = (elements, row) => {
    const { root } = elements;
    root.classList.toggle("sa-debugger-thread-running", !!row.running);
  };

  let threadInfoCache = new WeakMap();

  const allThreadIds = new WeakMap();
  let nextThreadId = 1;
  const getThreadId = (thread) => {
    if (!allThreadIds.has(thread)) {
      allThreadIds.set(thread, nextThreadId++);
    }
    return allThreadIds.get(thread);
  };

  const updateContent = () => {
    if (!logView.visible) {
      return;
    }

    const newRows = [];
    const threads = vm.runtime.threads;
    const visitedThreads = new Set();

    const createThreadInfo = (thread, depth) => {
      if (visitedThreads.has(thread)) {
        return [];
      }
      visitedThreads.add(thread);

      const id = getThreadId(thread);
      const target = thread.target;

      if (!threadInfoCache.has(thread)) {
        threadInfoCache.set(thread, {
          headerItem: {
            type: "thread-header",
            depth,
            targetName: target.getName(),
            id,
          },
          compiledItem: thread.isCompiled ? {
            type: "compiled",
            depth: 2,
          } : null,
          blockCache: new WeakMap(),
        });
      }
      const cacheInfo = threadInfoCache.get(thread);

      const runningThread = getRunningThread();
      const createBlockInfo = (block, stackFrameIdx) => {
        const blockId = block.id;
        if (!block) return;

        const stackFrame = thread.stackFrames[stackFrameIdx];

        if (!cacheInfo.blockCache.has(block)) {
          cacheInfo.blockCache.set(block, {});
        }

        const blockInfoMap = cacheInfo.blockCache.get(block);
        let blockInfo = blockInfoMap[stackFrameIdx];

        if (!blockInfo) {
          blockInfo = blockInfoMap[stackFrameIdx] = {
            type: "thread-stack",
            depth,
            targetId: target.id,
            blockId,
          };
        }

        blockInfo.running =
          thread === runningThread &&
          blockId === runningThread.peekStack() &&
          stackFrameIdx === runningThread.stackFrames.length - 1;

        const result = [blockInfo];
        if (stackFrame && stackFrame.executionContext && stackFrame.executionContext.startedThreads) {
          for (const thread of stackFrame.executionContext.startedThreads) {
            concatInPlace(result, createThreadInfo(thread, depth + 1));
          }
        }

        return result;
      };

      const topBlock = thread.target.blocks.getBlock(thread.topBlock);
      const result = [cacheInfo.headerItem];
      if (topBlock) {
        concatInPlace(result, createBlockInfo(topBlock, 0));
        for (let i = 0; i < thread.stack.length; i++) {
          const blockId = thread.stack[i];
          if (blockId === topBlock.id) continue;
          const block = thread.target.blocks.getBlock(blockId);
          if (block) {
            concatInPlace(result, createBlockInfo(block, i));
          }
        }
      }

      if (cacheInfo.compiledItem) {
        result.push(cacheInfo.compiledItem);
      }

      return result;
    };

    for (let i = 0; i < threads.length; i++) {
      const thread = threads[i];
      // Do not display threads used to update variable and list monitors.
      if (thread.updateMonitor) {
        continue;
      }
      concatInPlace(newRows, createThreadInfo(thread, 0));
    }

    logView.rows = newRows;
    logView.queueUpdateContent();
  };

  debug.addAfterStepCallback(() => {
    updateContent();
  });

  const show = () => {
    logView.show();
    updateContent();
  };
  const hide = () => {
    logView.hide();
  };

  return {
    tab,
    content: logView.outerElement,
    buttons: [],
    show,
    hide,
  };
}
