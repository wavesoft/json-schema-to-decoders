/**
 * An unsupported case encountered
 */
export class UnsupportedError extends Error {
  location: string[];

  constructor(location: string[], message: string) {
    super(`/${location.join("/")}: ${message}`);
    Object.setPrototypeOf(this, UnsupportedError.prototype);
    this.location = location;
  }
}

/**
 * The feature is only supported when the specified configuration parameter is given
 */
export class RequiredConfigurationError extends UnsupportedError {
  configProp: string;

  constructor(location: string[], configProp: string) {
    super(
      location,
      `To support this feature you must specify a value for the "${configProp}" property`
    );
    Object.setPrototypeOf(this, RequiredConfigurationError.prototype);
    this.configProp = configProp;
  }
}
