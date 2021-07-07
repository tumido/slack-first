import fs from 'fs';
import yaml from 'js-yaml';

type YamlFile = Record<string, unknown>;
/**
 * Load and parse YAML content of the config file
 * @returns Content of the config file
 */
export const loadYaml = (
    filename: string
): Record<string, unknown> | Array<unknown> => {
    return (yaml.load(fs.readFileSync(filename).toString()) as YamlFile) || {};
};

export const readFileToString = (filename: string): string => {
    return fs.readFileSync(filename).toString();
};
