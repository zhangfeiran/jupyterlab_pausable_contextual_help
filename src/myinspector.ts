// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { Printing } from '@jupyterlab/apputils';
import {
  ITranslator,
  nullTranslator,
  TranslationBundle
} from '@jupyterlab/translation';
import { Panel, PanelLayout, Widget } from '@lumino/widgets';
import { IMyInspector } from './tokens';

/**
 * The class name added to myinspector panels.
 */
const PANEL_CLASS = 'jp-MyInspector';

/**
 * The class name added to myinspector content.
 */
const CONTENT_CLASS = 'jp-MyInspector-content';

/**
 * The class name added to default myinspector content.
 */
const DEFAULT_CONTENT_CLASS = 'jp-MyInspector-default-content';

/**
 * A panel which contains a set of myinspectors.
 */
export class MyInspectorPanel
  extends Panel
  implements IMyInspector, Printing.IPrintable
{
  /**
   * Construct an myinspector.
   */
  constructor(options: MyInspectorPanel.IOptions = {}) {
    super();
    this.translator = options.translator || nullTranslator;
    this._trans = this.translator.load('jupyterlab');

    if (options.initialContent instanceof Widget) {
      this._content = options.initialContent;
    } else if (typeof options.initialContent === 'string') {
      this._content = MyInspectorPanel._generateContentWidget(
        `<p>${options.initialContent}</p>`
      );
    } else {
      this._content = MyInspectorPanel._generateContentWidget(
        '<p>' +
                this._trans.__('Press F1 on a function to see documentation.') +
          '</p>'
      );
    }

    this.addClass(PANEL_CLASS);
    (this.layout as PanelLayout).addWidget(this._content);
  }

  /**
   * Print in iframe
   */
  [Printing.symbol]() {
    return (): Promise<void> => Printing.printWidget(this);
  }

  /**
   * The source of events the myinspector panel listens for.
   */
  get source(): IMyInspector.IInspectable | null {
    return this._source;
  }
  set source(source: IMyInspector.IInspectable | null) {
    if (this._source === source) {
      return;
    }

    // Disconnect old signal handler.
    if (this._source) {
      this._source.standby = true;
      this._source.inspected.disconnect(this.onMyInspectorUpdate, this);
      this._source.disposed.disconnect(this.onSourceDisposed, this);
    }

    // Reject a source that is already disposed.
    if (source && source.isDisposed) {
      source = null;
    }

    // Update source.
    this._source = source;

    // Connect new signal handler.
    if (this._source) {
            //   this._source.standby = false;
      this._source.inspected.connect(this.onMyInspectorUpdate, this);
      this._source.disposed.connect(this.onSourceDisposed, this);
    }
  }

  /**
   * Dispose of the resources held by the widget.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this.source = null;
    super.dispose();
  }

  /**
   * Handle myinspector update signals.
   */
  protected onMyInspectorUpdate(
    sender: any,
    args: IMyInspector.IMyInspectorUpdate
  ): void {
    const { content } = args;

    // Update the content of the myinspector widget.
    if (!content || content === this._content) {
      return;
    }
    this._content.dispose();

    this._content = content;
    content.addClass(CONTENT_CLASS);
    (this.layout as PanelLayout).addWidget(content);
  }

  /**
   * Handle source disposed signals.
   */
  protected onSourceDisposed(sender: any, args: void): void {
    this.source = null;
  }

  /**
   * Generate content widget from string
   */
  private static _generateContentWidget(message: string): Widget {
    const widget = new Widget();
    widget.node.innerHTML = message;
    widget.addClass(CONTENT_CLASS);
    widget.addClass(DEFAULT_CONTENT_CLASS);

    return widget;
  }

  protected translator: ITranslator;
  private _trans: TranslationBundle;
  private _content: Widget;
  private _source: IMyInspector.IInspectable | null = null;
}

export namespace MyInspectorPanel {
  export interface IOptions {
    initialContent?: Widget | string | undefined;

    /**
     * The application language translator.
     */
    translator?: ITranslator;
  }
}
