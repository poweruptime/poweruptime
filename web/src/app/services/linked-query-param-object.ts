import {
  Injectable,
  InjectionToken,
  Injector,
  Provider,
  WritableSignal,
  effect,
  inject,
  runInInjectionContext,
  signal,
  untracked,
} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {ActivatedRoute, NavigationExtras, Params, Router} from '@angular/router';

import {map} from 'rxjs';

import {assertInjector} from 'ngxtension/assert-injector';
import {createNotifier} from 'ngxtension/create-notifier';
import {explicitEffect} from 'ngxtension/explicit-effect';

/**
 * These are the options that can be passed to the `linkedQueryParamObject` function.
 * They are taken from the `NavigationExtras` type in the `@angular/router` package.
 */
type NavigateMethodFields = Pick<
  NavigationExtras,
  | 'queryParamsHandling'
  | 'onSameUrlNavigation'
  | 'replaceUrl'
  | 'skipLocationChange'
  | 'preserveFragment'
>;

const defaultConfig: Partial<NavigateMethodFields> = {
  queryParamsHandling: 'merge',
};

const _LINKED_QUERY_PARAM_OBJECT_CONFIG_TOKEN = new InjectionToken<Partial<NavigateMethodFields>>(
  'LinkedQueryParamObjectConfig',
  {
    providedIn: 'root',
    factory: () => defaultConfig,
  },
);

/**
 * This function allows users to override the default behavior of the `linkedQueryParamObject` navigation extras per component.
 */
export function provideLinkedQueryParamObjectConfig(
  config: Partial<NavigateMethodFields>,
): Provider {
  return {
    provide: _LINKED_QUERY_PARAM_OBJECT_CONFIG_TOKEN,
    useValue: config,
  };
}

/**
 * Service to coalesce multiple navigation calls into a single navigation event.
 */
@Injectable({providedIn: 'root'})
export class LinkedQueryParamObjectGlobalHandler {
  private _router = inject(Router);
  /**
   * @internal
   * The current query params that will be set on the next navigation event.
   */
  private _currentParams: Params = {};
  /**
   * @internal
   * The navigation extras that will be used on the next navigation event.
   */
  private _navigationExtras: NavigationExtras = {};
  /**
   * @internal
   * The notifier that will be used to schedule the navigation event.
   */
  private _schedulerNotifier = createNotifier();

  constructor() {
    effect(() => {
      // listen to the scheduler notifier to schedule the navigation event
      if (this._schedulerNotifier.listen()) {
        // we need to untrack the navigation call in order to not register any other signal as a dependency
        untracked(() => void this.navigate());
      }
    });
  }

  /**
   * Schedules the navigation event.
   */
  scheduleNavigation() {
    this._schedulerNotifier.notify();
  }

  /**
   * Sets the query parameters that will be used on the next navigation event.
   */
  setQueryParams(params: Params) {
    this._currentParams = {...this._currentParams, ...params};
  }

  /**
   * Sets the navigation extras that will be used on the next navigation event.
   */
  setNavigationExtras(config: Partial<NavigateMethodFields> = {}) {
    const {
      queryParamsHandling,
      onSameUrlNavigation,
      replaceUrl,
      skipLocationChange,
      preserveFragment,
    } = config;
    if (queryParamsHandling || queryParamsHandling === '') {
      this._navigationExtras.queryParamsHandling = queryParamsHandling;
    }
    if (onSameUrlNavigation) {
      this._navigationExtras.onSameUrlNavigation = onSameUrlNavigation;
    }
    if (replaceUrl) {
      this._navigationExtras.replaceUrl = replaceUrl;
    }
    if (skipLocationChange) {
      this._navigationExtras.skipLocationChange = skipLocationChange;
    }
    if (preserveFragment) {
      this._navigationExtras.preserveFragment = preserveFragment;
    }
  }

  /**
   * Navigates to the current URL with the accumulated query parameters and navigation extras.
   * Cleans up the current params and navigation extras after the navigation.
   */
  private navigate(): Promise<boolean> {
    return this._router
      .navigate([], {
        queryParams: this._currentParams,
        ...this._navigationExtras,
      })
      .then((value) => {
        // Reset the current params and navigation extras on navigation
        this._currentParams = {};
        this._navigationExtras = {};
        return value;
      });
  }
}

type LinkedQueryParamObjectOptions = {
  /**
   * The injector to use to inject the router and activated route.
   */
  injector?: Injector;
} & Partial<NavigateMethodFields>;

/**
 * Creates a signal that is linked to a set of query parameters representing a nested object.
 * The parameters will be formatted using dot notation (e.g., filter.search, filter.statuses).
 *
 * @param prefix The prefix for all query parameters (e.g., 'filter')
 * @param options Configuration options for the signal
 * @returns A signal that is linked to the query parameters
 */
export function linkedQueryParamObject<T extends Record<string, any>>(
  prefix: string,
  options: LinkedQueryParamObjectOptions & {
    parse?: (params: URLSearchParams) => T;
    stringify?: (value: T, defaultValue?: T) => Record<string, string[]>;
    defaultValue?: T;
  } = {},
): WritableSignal<T> & {
  set: (value: T | null) => void;
  update: (fn: (value: T) => T | null) => void;
} {
  const injector = assertInjector(linkedQueryParamObject, options?.injector);

  return runInInjectionContext(injector, () => {
    const route = inject(ActivatedRoute);
    const globalHandler = inject(LinkedQueryParamObjectGlobalHandler);
    const config = inject(_LINKED_QUERY_PARAM_OBJECT_CONFIG_TOKEN);

    // Default parse function that extracts dot-notation parameters
    const defaultParse = (searchParams: URLSearchParams): T => {
      const result = {} as T;
      const prefixWithDot = `${prefix}.`;

      // Get all keys that start with our prefix
      for (const [key, value] of searchParams.entries()) {
        if (key.startsWith(prefixWithDot)) {
          const propPath = key.substring(prefixWithDot.length);
          const propParts = propPath.split('.');

          // Handle nested properties
          let current = result as any;
          for (let i = 0; i < propParts.length - 1; i++) {
            const part = propParts[i];
            if (!current[part]) {
              current[part] = {};
            }
            current = current[part];
          }

          const lastPart = propParts[propParts.length - 1];

          // Check if this property should be an array based on defaultValue
          const isArray =
            options.defaultValue &&
            Array.isArray(getNestedProperty(options.defaultValue, propParts));

          if (isArray) {
            if (!current[lastPart]) {
              current[lastPart] = [];
            }

            // Split by comma if values are comma-separated
            value
              .split(',')
              .filter(Boolean)
              .forEach((val) => {
                if (!current[lastPart].includes(val)) {
                  current[lastPart].push(val);
                }
              });
          } else {
            // Handle regular properties
            current[lastPart] = value;
          }
        }
      }

      return options.defaultValue ? {...options.defaultValue, ...result} : result;
    };

    // Helper function to get a nested property from an object
    function getNestedProperty(obj: any, path: string[]): any {
      return path.reduce(
        (prev, curr) => (prev && prev[curr] !== undefined ? prev[curr] : undefined),
        obj,
      );
    }

    // Default stringify function that converts object to dot-notation parameters
    const defaultStringify = (value: T, defaultValue?: T): Record<string, string[]> => {
      if (!value) return {};

      const result: Record<string, string[]> = {};

      // Recursive function to handle nested objects
      const processObject = (obj: any, path: string = '', defaultObj?: any) => {
        for (const [key, val] of Object.entries(obj)) {
          const currentPath = path ? `${path}.${key}` : `${prefix}.${key}`;
          const defaultVal = defaultObj ? defaultObj[key] : undefined;

          if (val === null || val === undefined) {
            // Skip null/undefined values
            continue;
          } else if (Array.isArray(val)) {
            // Handle arrays - create separate entries for each array item
            if (val.length > 0) {
              result[currentPath] = val.map((item) => String(item));
            }
          } else if (typeof val === 'object') {
            // Handle nested objects
            processObject(val, currentPath, defaultVal);
          } else {
            // Handle primitive values
            result[currentPath] = [String(val)];
          }
        }
      };

      processObject(value, '', defaultValue);
      return result;
    };

    const parse = options.parse || defaultParse;
    const stringify = options.stringify || defaultStringify;

    // Parse the query parameters
    const parseParamValue = () => {
      const searchParams = new URLSearchParams(window.location.search);
      return parse(searchParams);
    };

    // Create a signal that updates when any relevant query parameter changes
    const queryParamValue = toSignal(route.queryParams.pipe(map(() => parseParamValue())), {
      initialValue: parseParamValue(),
    });

    const source = signal<T>(queryParamValue() as T);
    const originalSet = source.set;

    explicitEffect([queryParamValue], ([value]) => {
      // Update the source signal whenever the query params change
      originalSet(value as T);
    });

    const set = (value: T | null) => {
      // Set default value if null
      if (value === null && options.defaultValue) {
        value = options.defaultValue;
      }

      // Update the signal value synchronously
      originalSet(value as T);

      // Build query params object for router navigation
      const queryParams: Params = {};

      if (value === null) {
        // Remove all parameters with our prefix
        const currentParams = new URLSearchParams(window.location.search);
        const prefixWithDot = `${prefix}.`;

        [...currentParams.keys()]
          .filter((key) => key.startsWith(prefixWithDot))
          .forEach((key) => {
            queryParams[key] = null;
          });
      } else {
        // Convert object to dot notation parameters
        const paramMap = stringify(value, options.defaultValue);

        // Clear existing parameters with our prefix first
        const currentParams = new URLSearchParams(window.location.search);
        const prefixWithDot = `${prefix}.`;

        [...currentParams.keys()]
          .filter((key) => key.startsWith(prefixWithDot))
          .forEach((key) => {
            queryParams[key] = null;
          });

        // Set new parameters
        for (const [key, values] of Object.entries(paramMap)) {
          queryParams[key] = values.length === 1 ? values[0] : values;
        }
      }

      // Set the query params and navigation extras
      globalHandler.setQueryParams(queryParams);
      globalHandler.setNavigationExtras({
        ...defaultConfig,
        ...config,
        ...(options ?? {}),
      });

      // Schedule the navigation event
      globalHandler.scheduleNavigation();
    };

    const update = (fn: (value: T) => T | null) => set(fn(source()));

    return Object.assign(source, {set, update});
  });
}
