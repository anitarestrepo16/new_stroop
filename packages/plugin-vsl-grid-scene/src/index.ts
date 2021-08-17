import { JsPsych, JsPsychPlugin, TrialType, parameterType } from "jspsych";

const info = <const>{
  name: "vsl-grid-scene",
  parameters: {
    stimuli: {
      /* An array of images that defines a grid. */
      type: parameterType.IMAGE,
      pretty_name: "Stimuli",
      array: true,
      default: undefined,
      preload: true
    },
    /* Array specifying the width and height of the images to show. */
    image_size: {
      type: parameterType.INT,
      pretty_name: "Image size",
      array: true,
      default: [100, 100]
    },
    /* How long to show the stimulus for in milliseconds. */
    trial_duration: {
      type: parameterType.INT,
      pretty_name: "Trial duration",
      default: 2000
    }
  }
};

type Info = typeof info;

/**
 * jsPsych plugin for showing scenes that mimic the experiments described in
 *
 * Fiser, J., & Aslin, R. N. (2001). Unsupervised statistical learning of
 * higher-order spatial structures from visual scenes. Psychological science,
 * 12(6), 499-504.
 *
 * Josh de Leeuw
 *
 * documentation: docs.jspsych.org
 *
 */
class VslGridScenePlugin implements JsPsychPlugin<Info> {
  static info = info;

  constructor(private jsPsych: JsPsych) {};

  trial(display_element: HTMLElement, trial: TrialType<Info>) {
    display_element.innerHTML = this.generate_stimulus(trial.stimuli, trial.image_size);

    this.jsPsych.pluginAPI.setTimeout(function () {
      endTrial();
    }, trial.trial_duration);

    const endTrial = () => {
      display_element.innerHTML = "";

      var trial_data = {
        stimulus: trial.stimuli,
      };

      this.jsPsych.finishTrial(trial_data);
    }
  };

  generate_stimulus(pattern, image_size: number[]) {
    var nrows = pattern.length;
    var ncols = pattern[0].length;

    // create blank element to hold code that we generate
    var html = '<div id="jspsych-vsl-grid-scene-dummy" css="display: none;">';

    // create table
    html +=
      '<table id="jspsych-vsl-grid-scene table" ' +
      'style="border-collapse: collapse; margin-left: auto; margin-right: auto;">';

    for (var row = 0; row < nrows; row++) {
      html +=
        '<tr id="jspsych-vsl-grid-scene-table-row-' +
        row +
        '" css="height: ' +
        image_size[1] +
        'px;">';

      for (var col = 0; col < ncols; col++) {
        html +=
          '<td id="jspsych-vsl-grid-scene-table-' +
          row +
          "-" +
          col +
          '" ' +
          'style="padding: ' +
          image_size[1] / 10 +
          "px " +
          image_size[0] / 10 +
          'px; border: 1px solid #555;">' +
          '<div id="jspsych-vsl-grid-scene-table-cell-' +
          row +
          "-" +
          col +
          '" style="width: ' +
          image_size[0] +
          "px; height: " +
          image_size[1] +
          'px;">';
        if (pattern[row][col] !== 0) {
          html +=
            "<img " +
            'src="' +
            pattern[row][col] +
            '" style="width: ' +
            image_size[0] +
            "px; height: " +
            image_size[1] +
            '"></img>';
        }
        html += "</div>";
        html += "</td>";
      }
      html += "</tr>";
    }

    html += "</table>";
    html += "</div>";

    return html;
  };
}

export default VslGridScenePlugin;
