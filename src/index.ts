// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

// export * from './handler';
// export * from './myinspector';
// export * from './kernelconnector';
// export * from './tokens';

// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  ILabShell,
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

// import { ISettingRegistry } from '@jupyterlab/settingregistry';

import {
  ICommandPalette,
  MainAreaWidget,
  WidgetTracker
} from '@jupyterlab/apputils';
import { IConsoleTracker } from '@jupyterlab/console';
//   import {
//     IMyInspector,
//     InspectionHandler,
//     MyInspectorPanel,
//     KernelConnector
//   } from '@jupyterlab/inspector';
import { IMyInspector } from './tokens';
import { InspectionHandler } from './handler';
import { MyInspectorPanel } from './myinspector';
import { KernelConnector } from './kernelconnector';


import { ILauncher } from '@jupyterlab/launcher';
import { INotebookTracker } from '@jupyterlab/notebook';
import { ITranslator } from '@jupyterlab/translation';
import { inspectorIcon } from '@jupyterlab/ui-components';
import { Widget } from '@lumino/widgets';

/**
 * The command IDs used by the myinspector plugin.
 */
namespace CommandIDs {
  export const open = 'myinspector:open';
  export const close = 'myinspector:close';
  export const toggle = 'myinspector:toggle';
  export const trigger = 'myinspector:trigger';
  export const toggleStandby = 'myinspector:toggleStandby';
}

/**
 * A service providing code introspection.
 */
const myinspector: JupyterFrontEndPlugin<IMyInspector> = {
  id: 'jupyterlab_pausable_contextual_help:myinspector',
  description: 'Provides the pausable code introspection widget.',
  requires: [ITranslator],
  optional: [ICommandPalette, ILauncher, ILayoutRestorer],
  provides: IMyInspector,
  autoStart: true,
  activate: (
    app: JupyterFrontEnd,
    translator: ITranslator,
    palette: ICommandPalette | null,
    launcher: ILauncher | null,
    restorer: ILayoutRestorer | null
  ): IMyInspector => {
    const trans = translator.load('jupyterlab');
    const { commands, shell } = app;
    const caption = trans.__(
            'Manually updating code documentation from the active kernel'
    );
    const openedLabel = trans.__('My Contextual Help');
    const namespace = 'myinspector';
    const datasetKey = 'jpMyInspector';
    const tracker = new WidgetTracker<MainAreaWidget<MyInspectorPanel>>({
      namespace
    });

    function isMyInspectorOpen() {
      return myinspector && !myinspector.isDisposed;
    }

    function isStandby() {
      // return myinspector && myinspector.content && myinspector.content.source && myinspector.content.source.standby;
      if (myinspector && myinspector.content && myinspector.content.source) {
        return myinspector.content.source.standby;
      }
      return false;
    }

    let source: IMyInspector.IInspectable | null = null;
    let myinspector: MainAreaWidget<MyInspectorPanel>;
    function openMyInspector(args: string): MainAreaWidget<MyInspectorPanel> {
      if (!isMyInspectorOpen()) {
        myinspector = new MainAreaWidget({
          content: new MyInspectorPanel({ translator })
        });
        myinspector.id = 'jp-myinspector';
        myinspector.title.label = openedLabel;
        myinspector.title.icon = inspectorIcon;
        void tracker.add(myinspector);
        source = source && !source.isDisposed ? source : null;
        myinspector.content.source = source;
        myinspector.content.source?.onEditorChange(args);
      }
      if (!myinspector.isAttached) {
        shell.add(myinspector, 'main', {
          activate: false,
          mode: 'split-right',
          type: 'MyInspector'
        });
      }
      shell.activateById(myinspector.id);
      document.body.dataset[datasetKey] = 'open';
      return myinspector;
    }
    function closeMyInspector(): void {
      myinspector.dispose();
      delete document.body.dataset[datasetKey];
    }

    // Add myinspector:open command to registry.
    const showLabel = trans.__('Open My Contextual Help');
    commands.addCommand(CommandIDs.open, {
      caption,
      isEnabled: () =>
        !myinspector ||
        myinspector.isDisposed ||
        !myinspector.isAttached ||
        !myinspector.isVisible,
      label: showLabel,
      icon: args => (args.isLauncher ? inspectorIcon : undefined),
      execute: args => {
        const text = args && (args.text as string);
        const refresh = args && (args.refresh as boolean);
        // if myinspector is open, see if we need a refresh
        if (isMyInspectorOpen() && refresh)
          myinspector.content.source?.onEditorChange(text);
        else openMyInspector(text);
      }
    });

    // Add myinspector:close command to registry.
    const closeLabel = trans.__('Hide My Contextual Help');
    commands.addCommand(CommandIDs.close, {
      caption,
      isEnabled: () => isMyInspectorOpen(),
      label: closeLabel,
      icon: args => (args.isLauncher ? inspectorIcon : undefined),
      execute: () => closeMyInspector()
    });

    // Add myinspector:toggle command to registry.
    const toggleLabel = trans.__('Show My Contextual Help');
    commands.addCommand(CommandIDs.toggle, {
      caption,
      label: toggleLabel,
      isToggled: () => isMyInspectorOpen(),
      execute: args => {
        if (isMyInspectorOpen()) {
          closeMyInspector();
        } else {
          const text = args && (args.text as string);
          openMyInspector(text);
        }
      }
    });

    // Add myinspector:trigger command to registry.
    const triggerLabel = trans.__('Trigger My Contextual Help');
    commands.addCommand(CommandIDs.trigger, {
      caption,
      isEnabled: () => isStandby(),
      label: triggerLabel,
      execute: () => {
        if (myinspector && myinspector.content && myinspector.content.source && isStandby()) {
          myinspector.content.source.standby = false;
          myinspector.content.source?.onEditorChange();
          myinspector.content.source.standby = true;
        }
      }
    });

    // Add myinspector:toggleStandby command to registry.
    const toggleStandbyLabel = trans.__('Auto Update My Contextual Help');
    commands.addCommand(CommandIDs.toggleStandby, {
      caption,
      isToggled: () => !isStandby(),
      label: toggleStandbyLabel,
      execute: () => {
        if (myinspector && myinspector.content && myinspector.content.source) {
          if (isStandby()) {
            myinspector.content.source.standby = false;
          } else {
            myinspector.content.source.standby = true;
          }
        }
      }
    });

    // Add open command to launcher if possible.
    if (launcher) {
      launcher.add({ command: CommandIDs.open, args: { isLauncher: true } });
    }

    // Add toggle command to command palette if possible.
    if (palette) {
      palette.addItem({ command: CommandIDs.toggle, category: toggleLabel });
    }

    // Handle state restoration.
    if (restorer) {
      void restorer.restore(tracker, {
        command: CommandIDs.toggle,
        name: () => 'myinspector'
      });
    }

    // Create a proxy to pass the `source` to the current myinspector.
    const proxy = Object.defineProperty({} as IMyInspector, 'source', {
      get: (): IMyInspector.IInspectable | null =>
        !myinspector || myinspector.isDisposed ? null : myinspector.content.source,
      set: (src: IMyInspector.IInspectable | null) => {
        source = src && !src.isDisposed ? src : null;
        if (myinspector && !myinspector.isDisposed) {
          myinspector.content.source = source;
        }
      }
    });

    return proxy;
  }
};

/**
 * An extension that registers consoles for inspection.
 */
const consoles: JupyterFrontEndPlugin<void> = {
  // FIXME This should be in @jupyterlab/console-extension
  id: 'jupyterlab_pausable_contextual_help:consoles',
  description: 'Adds my code introspection support to consoles.',
  requires: [IMyInspector, IConsoleTracker, ILabShell],
  autoStart: true,
  activate: (
    app: JupyterFrontEnd,
    manager: IMyInspector,
    consoles: IConsoleTracker,
    labShell: ILabShell,
    translator: ITranslator
  ): void => {
    // Maintain association of new consoles with their respective handlers.
    const handlers: { [id: string]: InspectionHandler } = {};

    // Create a handler for each console that is created.
    consoles.widgetAdded.connect((sender, parent) => {
      const sessionContext = parent.console.sessionContext;
      const rendermime = parent.console.rendermime;
      const connector = new KernelConnector({ sessionContext });
      const handler = new InspectionHandler({ connector, rendermime });

      // Associate the handler to the widget.
      handlers[parent.id] = handler;

      // Set the initial editor.
      const cell = parent.console.promptCell;
      handler.editor = cell && cell.editor;

      // Listen for prompt creation.
      parent.console.promptCellCreated.connect((sender, cell) => {
        handler.editor = cell && cell.editor;
      });

      // Listen for parent disposal.
      parent.disposed.connect(() => {
        delete handlers[parent.id];
        handler.dispose();
      });
    });

    // Keep track of console instances and set myinspector source.
    const setSource = (widget: Widget | null): void => {
      if (widget && consoles.has(widget) && handlers[widget.id]) {
        manager.source = handlers[widget.id];
      }
    };
    labShell.currentChanged.connect((_, args) => setSource(args.newValue));
    void app.restored.then(() => setSource(labShell.currentWidget));

    app.contextMenu.addItem({
      command: CommandIDs.toggle,
      selector: '.jp-CodeConsole-promptCell'
    });

    app.contextMenu.addItem({
      command: CommandIDs.toggleStandby,
      selector: '.jp-CodeConsole-promptCell'
    });

  }
};

/**
 * An extension that registers notebooks for inspection.
 */
const notebooks: JupyterFrontEndPlugin<void> = {
  // FIXME This should be in @jupyterlab/notebook-extension
  id: 'jupyterlab_pausable_contextual_help:notebooks',
  description: 'Adds code introspection to notebooks.',
  requires: [IMyInspector, INotebookTracker, ILabShell],
  autoStart: true,
  activate: (
    app: JupyterFrontEnd,
    manager: IMyInspector,
    notebooks: INotebookTracker,
    labShell: ILabShell
  ): void => {
    // Maintain association of new notebooks with their respective handlers.
    const handlers: { [id: string]: InspectionHandler } = {};

    // Create a handler for each notebook that is created.
    notebooks.widgetAdded.connect((sender, parent) => {
      const sessionContext = parent.sessionContext;
      const rendermime = parent.content.rendermime;
      const connector = new KernelConnector({ sessionContext });
      const handler = new InspectionHandler({ connector, rendermime });

      // Associate the handler to the widget.
      handlers[parent.id] = handler;

      // Set the initial editor.
      const cell = parent.content.activeCell;
      handler.editor = cell && cell.editor;

      // Listen for active cell changes.
      parent.content.activeCellChanged.connect((sender, cell) => {
        void cell?.ready.then(() => {
          if (cell === parent.content.activeCell) {
            handler.editor = cell!.editor;
          }
        });
      });

      // Listen for parent disposal.
      parent.disposed.connect(() => {
        delete handlers[parent.id];
        handler.dispose();
      });
    });

    // Keep track of notebook instances and set myinspector source.
    const setSource = (widget: Widget | null): void => {
      if (widget && notebooks.has(widget) && handlers[widget.id]) {
        manager.source = handlers[widget.id];
      }
    };
    labShell.currentChanged.connect((_, args) => setSource(args.newValue));
    void app.restored.then(() => setSource(labShell.currentWidget));

    app.contextMenu.addItem({
      command: CommandIDs.toggle,
      selector: '.jp-Notebook'
    });

    app.contextMenu.addItem({
      command: CommandIDs.toggleStandby,
      selector: '.jp-Notebook'
    });

  }
};

/**
 * Export the plugins as default.
 */
const plugins: JupyterFrontEndPlugin<any>[] = [myinspector, consoles, notebooks];
export default plugins;
