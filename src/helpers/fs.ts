import fs from 'fs';
import yaml from 'js-yaml';

/**
 * Load and parse YAML content of the config file
 * @returns Content of the config file
 */
export const loadYaml = (filename: string): Record<string, unknown> => {
    return (yaml.load(fs.readFileSync(filename).toString()) as Record<string, unknown>) || {};
};
