// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { Token } from '@lumino/coreutils';
import { ISignal } from '@lumino/signaling';
import { Widget } from '@lumino/widgets';

/**
 * The myinspector panel token.
 */
export const IMyInspector = new Token<IMyInspector>(
  '@jupyterlab/inspector:IMyInspector',
  `A service for adding contextual help to widgets (visible using "Show Contextual Help" from the Help menu).
  Use this to hook into the contextual help system in your extension.`
);

/**
 * An interface for an myinspector.
 */
export interface IMyInspector {
  /**
   * The source of events the myinspector listens for.
   */
  source: IMyInspector.IInspectable | null;
}

/**
 * A namespace for myinspector interfaces.
 */
export namespace IMyInspector {
  /**
   * The definition of an inspectable source.
   */
  export interface IInspectable {
    /**
     * A signal emitted when the myinspector should clear all items.
     */
    cleared: ISignal<any, void>;

    /**
     * A signal emitted when the inspectable is disposed.
     */
    disposed: ISignal<any, void>;

    /**
     * A signal emitted when an myinspector value is generated.
     */
    inspected: ISignal<any, IMyInspectorUpdate>;

    /**
     * Test whether the inspectable has been disposed.
     */
    isDisposed: boolean;

    /**
     * Indicates whether the inspectable source emits signals.
     *
     * #### Notes
     * The use case for this attribute is to limit the API traffic when no
     * myinspector is visible. It can be modified by the consumer of the source.
     */
    standby: boolean;
    /**
     * Handle a text changed signal from an editor.
     *
     * #### Notes
     * Update the hints myinspector based on a text change.
     */
    onEditorChange(customText?: string): void;
  }

  /**
   * An update value for code myinspectors.
   */
  export interface IMyInspectorUpdate {
    /**
     * The content being sent to the myinspector for display.
     */
    content: Widget | null;
  }
}
