import {
  App,
  debounce,
  Editor,
  MarkdownView,
  Modal,
  Notice,
  normalizePath,
  Plugin,
  PluginSettingTab,
  Setting,
  ToggleComponent,
} from "obsidian";

export interface ObsidianRewarderSettings {
  completedTaskCharacter: string;
  escapeCharacterBegin: string;
  escapeCharacterEnd: string;
  occurrenceTypes: {label: string, value: number}[];
  rewardsFile: string;
  saveRewardToDaily: boolean;
  saveRewardSectionHeading?: string;
  saveTaskToDaily: boolean;
  saveTaskSectionHeading?: string;
  showModal: boolean;
  useAsInspirational: boolean;
  rewardPreface: string;
}

export const DEFAULT_SETTINGS: ObsidianRewarderSettings = {
  completedTaskCharacter: "☑️",
  escapeCharacterBegin: "{",
  escapeCharacterEnd: "}",
  occurrenceTypes: [
    { label: "common", value: 20 },
    { label: "rare", value: 5 },
    { label: "legendary", value: 0.5 },
  ],
  rewardsFile: "Rewards.md",
  saveRewardToDaily: false,
  saveRewardSectionHeading: undefined,
  saveTaskToDaily: false,
  saveTaskSectionHeading: undefined,
  showModal: true,
  useAsInspirational: false,
  rewardPreface: "- [ ] Earned reward: ",
};

import ObsidianRewarder from "./main"

export class ObsidianRewarderSettingsTab extends PluginSettingTab {
  plugin: ObsidianRewarder;

  constructor(app: App, plugin: ObsidianRewarder) {
    super(app, plugin);
    this.plugin = plugin;
  }

  sanitiseNote(value: string): string | null {
    // Taken from homepage plugin
    if (value === null || value.match(/^\s*$/) !== null) {
      return null;
    }
    return normalizePath(value);
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    // Settings for functionality

    containerEl.createEl("h1", { text: "Functionality settings" });

    new Setting(this.containerEl)
      .setName("File with Rewards")
      .setDesc('For example "Rewards.md" or "Folder/Rewards.md"')
      .addText((text) => {
        text
          .setPlaceholder(DEFAULT_SETTINGS.rewardsFile)
          .setValue(
            this.plugin.settings.rewardsFile.length > 0
              ? this.plugin.settings.rewardsFile
              : ""
          )
          .onChange(async (value) => {
            this.plugin.settings.rewardsFile =
              this.sanitiseNote(value) || DEFAULT_SETTINGS.rewardsFile;
            await this.plugin.saveSettings();
          });
      });

    new Setting(this.containerEl)
      .setName("Show popup when reward is awarded")
      .setDesc("If disabled a less prominent notice will be shown instead")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.showModal);
        toggle.onChange(async (value) => {
          this.plugin.settings.showModal = value;
          await this.plugin.saveSettings();
        });
      });

    new Setting(this.containerEl)
      .setName("Save rewards in daily note")
      .setDesc("Will save rewards received to the end of the daily note or section heading specified below")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.saveRewardToDaily);
        toggle.onChange(async (value) => {
          this.plugin.settings.saveRewardToDaily = value;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName("The section heading of daily note used to save rewards")
      .setDesc(
        "This section heading is used as the place for saving rewards received in the daily note"
      )
      .addText((text) =>
        text
          .setPlaceholder("## Rewards")
          .setValue(
            this.plugin.settings.saveRewardSectionHeading
              ? this.plugin.settings.saveRewardSectionHeading
              : "")
          .onChange(async (value) => {
            if (value.length > 0 && value.match(/^#+/)) {
              this.plugin.settings.saveRewardSectionHeading = value;
              await this.plugin.saveSettings();
            }
          })
      )
      .addExtraButton((button) =>
        button
          .setIcon("reset")
          .setTooltip("Restore default")
          .onClick(async () => {
            this.plugin.settings.saveRewardSectionHeading =
              DEFAULT_SETTINGS.saveRewardSectionHeading;
            await this.plugin.saveSettings();
            this.display();
          })
      );

    new Setting(containerEl)
    .setName("Reward preface text")
    .setDesc("The text that appears before each reward in the daily note")
    .addText((text) =>
      text
        .setPlaceholder("- [ ] Earned reward: ")
        .setValue(this.plugin.settings.rewardPreface)
        .onChange(async (value) => {
          this.plugin.settings.rewardPreface = value;
          await this.plugin.saveSettings();
        })
    )
    .addExtraButton((button) =>
      button
        .setIcon("reset")
        .setTooltip("Restore default")
        .onClick(async () => {
          this.plugin.settings.rewardPreface = DEFAULT_SETTINGS.rewardPreface;
          await this.plugin.saveSettings();
          this.display();
        })
    );

    new Setting(this.containerEl)
      .setName("Save task in daily note")
      .setDesc("Will save completed tasks to the end of the daily note or section heading specified below")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.saveTaskToDaily);
        toggle.onChange(async (value) => {
          this.plugin.settings.saveTaskToDaily = value;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName("The section heading of daily note used to save tasks")
      .setDesc(
        "This section heading is used as the place for saving the completed tasks in the daily note"
      )
      .addText((text) =>
        text
          .setPlaceholder("## CompletedTasks")
          .setValue(
            this.plugin.settings.saveTaskSectionHeading
              ? this.plugin.settings.saveTaskSectionHeading
              : "")
          .onChange(async (value) => {
            if (value.length > 0 && value.match(/^#+/)) {
              this.plugin.settings.saveTaskSectionHeading = value;
              await this.plugin.saveSettings();
            }
          })
      )
      .addExtraButton((button) =>
        button
          .setIcon("reset")
          .setTooltip("Restore default")
          .onClick(async () => {
            this.plugin.settings.saveTaskSectionHeading =
              DEFAULT_SETTINGS.saveTaskSectionHeading;
            await this.plugin.saveSettings();
            this.display();
          })
      );

    new Setting(this.containerEl)
      .setName("Use with quotes instead of rewards")
      .setDesc(
        "Rewards are shown as inspirational quotes instead of congratulations"
      )
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.useAsInspirational);
        toggle.onChange(async (value) => {
          this.plugin.settings.useAsInspirational = value;
          await this.plugin.saveSettings();
        });
      });

    containerEl.createEl("h1", { text: "Reward settings" });

    // Settings for occurence

    containerEl.createEl("h3", {
      text: "Occurrence values",
    });

    for (
      let i = 0;
      i < Object.keys(this.plugin.settings.occurrenceTypes).length;
      i++
    ) {
      new Setting(containerEl)
        .setName(
          "How often should " +
            this.plugin.settings.occurrenceTypes[i].label +
            " rewards occur?"
        )
        .setDesc(
          "Between 0.1% to 100% for every finished task" +
            (i === 0 ? ". This is the default value for rewards" : "")
        )
        .addText((text) => {
          text.inputEl.type = "number";
          text
            .setPlaceholder(this.plugin.settings.occurrenceTypes[i].value)
            .setValue(this.plugin.settings.occurrenceTypes[i].value.toString())
            .onChange(async (text: string) => {
              if (text.length > 0) {
                let value = parseFloat(text);
                let refreshDisplay = false;
                if (value > 100) {
                  value = 100;
                  refreshDisplay = true;
                } else if (value < 0.1) {
                  value = 0.1;
                  refreshDisplay = true;
                }
                this.plugin.settings.occurrenceTypes[i].value = Number(value);
                await this.plugin.saveSettings();
                if (refreshDisplay) {
                  this.display();
                }
              }
            });
        })
        .addExtraButton((button) =>
          button
            .setIcon("reset")
            .setTooltip("Restore default")
            .onClick(async () => {
              this.plugin.settings.occurrenceTypes[i].value =
                DEFAULT_SETTINGS.occurrenceTypes[i].value;
              await this.plugin.saveSettings();
              this.display();
            })
        );
    }

    // Settings for occurence labels

    containerEl.createEl("h3", {
      text: "Occurence labels",
    });

    for (
      let i = 0;
      i < Object.keys(this.plugin.settings.occurrenceTypes).length;
      i++
    ) {
      new Setting(containerEl)
        .setName(
          'Would you like to rename "' +
            this.plugin.settings.occurrenceTypes[i].label +
            '"?'
        )
        .addText((text) => {
          text.inputEl.type = "text";
          text
            .setPlaceholder(this.plugin.settings.occurrenceTypes[i].label)
            .setValue(this.plugin.settings.occurrenceTypes[i].label)
            .onChange(async (value) => {
              if (value.length > 0) {
                this.plugin.settings.occurrenceTypes[i].label = value;
                await this.plugin.saveSettings();
              }
            });
        })
        .addExtraButton((button) =>
          button
            .setIcon("reset")
            .setTooltip("Restore default")
            .onClick(async () => {
              this.plugin.settings.occurrenceTypes[i].label =
                DEFAULT_SETTINGS.occurrenceTypes[i].label;
              await this.plugin.saveSettings();
              this.display();
            })
        );
    }

    // Settings for escape characters

    containerEl.createEl("h3", {
      text: "Special characters",
    });

    new Setting(containerEl)
      .setName("Completed task")
      .setDesc(
        "This character is used as prefix for completed tasks in the daily note"
      )
      .addText((text) =>
        text
          .setPlaceholder("{")
          .setValue(this.plugin.settings.completedTaskCharacter)
          .onChange(async (value) => {
            if (value.length > 0) {
              this.plugin.settings.completedTaskCharacter = value;
              await this.plugin.saveSettings();
            }
          })
      )
      .addExtraButton((button) =>
        button
          .setIcon("reset")
          .setTooltip("Restore default")
          .onClick(async () => {
            this.plugin.settings.completedTaskCharacter =
              DEFAULT_SETTINGS.completedTaskCharacter;
            await this.plugin.saveSettings();
            this.display();
          })
      );

    new Setting(containerEl)
      .setName("Start of metadata")
      .setDesc("This character shows the start of the reward's data")
      .addText((text) =>
        text
          .setPlaceholder("{")
          .setValue(this.plugin.settings.escapeCharacterBegin)
          .onChange(async (value) => {
            if (value.length > 0) {
              this.plugin.settings.escapeCharacterBegin = value;
              await this.plugin.saveSettings();
            }
          })
      )
      .addExtraButton((button) =>
        button
          .setIcon("reset")
          .setTooltip("Restore default")
          .onClick(async () => {
            this.plugin.settings.escapeCharacterBegin =
              DEFAULT_SETTINGS.escapeCharacterBegin;
            await this.plugin.saveSettings();
            this.display();
          })
      );
    new Setting(containerEl)
      .setName("End of metadata")
      .setDesc("This character shows the end of the reward's data")
      .addText((text) => {
        text
          .setPlaceholder("}")
          .setValue(this.plugin.settings.escapeCharacterEnd)
          .onChange(async (value) => {
            if (value.length > 0) {
              this.plugin.settings.escapeCharacterEnd = value;
              await this.plugin.saveSettings();
            }
          });
      })
      .addExtraButton((button) =>
        button
          .setIcon("reset")
          .setTooltip("Restore default")
          .onClick(async () => {
            this.plugin.settings.escapeCharacterEnd =
              DEFAULT_SETTINGS.escapeCharacterEnd;
            await this.plugin.saveSettings();
            this.display();
          })
      );
  }
}
