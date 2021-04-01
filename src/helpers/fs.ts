import fs from 'fs';
import yaml from 'js-yaml';

/**
 * Load and parse YAML content of the config file
 * @returns Content of the config file
 */
export const loadYaml = (filename: string): Record<string, unknown> => {
    return (yaml.load(fs.readFileSync(filename).toString()) as Record<string, unknown>) || {};
};

/**
 * Save Object as a YAML to file
 * @param filename File location where the content will be stored
 * @param content Content of the target file
 */
export const writeYaml = async (filename: string, content: Record<string, unknown>): Promise<void> => {
    fs.writeFileSync(filename, yaml.dump(content));
};
