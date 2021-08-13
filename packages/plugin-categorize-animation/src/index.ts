import { JsPsych, JsPsychPlugin, TrialType, parameterType } from "jspsych";

const info = <const>{
  name: "categorize-animation",
  parameters: {
    /* Array of paths to image files. */
    stimuli: {
      type: parameterType.IMAGE,
      pretty_name: "Stimuli",
      default: undefined,
      preload: 'image'
    },
    /* The key to indicate correct response */
    key_answer: {
      type: parameterType.KEY,
      pretty_name: "Key answer",
      default: undefined
    },
    /* The keys subject is allowed to press to respond to stimuli. */
    choices: {
      type: parameterType.KEY,
      pretty_name: "Choices",
      default: "allkeys",
      array: true
    },
    /* Text to describe correct answer. */
    text_answer: {
      type: parameterType.STRING,
      pretty_name: "Text answer",
      default: null
    },
    /* String to show when subject gives correct answer */
    correct_text: {
      type: parameterType.STRING,
      pretty_name: "Correct text",
      default: "Correct."
    },
    /* String to show when subject gives incorrect answer. */
    incorrect_text: {
      type: parameterType.STRING,
      pretty_name: "Incorrect text",
      default: "Wrong."
    },
    /* Duration to display each image. */
    frame_time: {
      type: parameterType.INT,
      pretty_name: "Frame time",
      default: 500
    },
    /* How many times to display entire sequence. */
    sequence_reps: {
      type: parameterType.INT,
      pretty_name: "Sequence repetitions",
      default: 1
    },
    /* If true, subject can response before the animation sequence finishes */
    allow_response_before_complete: {
      type: parameterType.BOOL,
      pretty_name: "Allow response before complete",
      default: false
    },
    /* How long to show feedback */
    feedback_duration: {
      type: parameterType.INT,
      pretty_name: "Feedback duration",
      default: 2000
    },
    /* Any content here will be displayed below the stimulus. */
    prompt: {
      type: parameterType.STRING,
      pretty_name: "Prompt",
      default: null
    },
    /* If true, the images will be drawn onto a canvas element (prevents blank screen between consecutive images in some browsers).
    If false, the image will be shown via an img element. */
    render_on_canvas: {
      type: parameterType.BOOL,
      pretty_name: "Render on canvas",
      default: true
    }
  }
};

type Info = typeof info;

/**
 * jspsych plugin for categorization trials with feedback and animated stimuli
 * Josh de Leeuw
 *
 * documentation: docs.jspsych.org
 **/
class CategorizeAnimationPlugin implements JsPsychPlugin<Info> {
  static info = info;

  constructor(private jsPsych: JsPsych) {}

  trial(display_element: HTMLElement, trial: TrialType<Info>) {
    var animate_frame = -1;
    var reps = 0;

    var showAnimation = true;

    var responded = false;
    var timeoutSet = false;
    var correct;

    if (trial.render_on_canvas) {
      // first clear the display element (because the render_on_canvas method appends to display_element instead of overwriting it with .innerHTML)
      if (display_element.hasChildNodes()) {
        // can't loop through child list because the list will be modified by .removeChild()
        while (display_element.firstChild) {
          display_element.removeChild(display_element.firstChild);
        }
      }
      var canvas = document.createElement("canvas");
      canvas.id = "jspsych-categorize-animation-stimulus";
      canvas.style.margin = "0";
      canvas.style.padding = "0";
      display_element.insertBefore(canvas, null);
      var ctx = canvas.getContext("2d");
      if (trial.prompt !== null) {
        var prompt_div = document.createElement("div");
        prompt_div.id = "jspsych-categorize-animation-prompt";
        prompt_div.style.visibility = "hidden";
        prompt_div.innerHTML = trial.prompt;
        display_element.insertBefore(prompt_div, canvas.nextElementSibling);
      }
      var feedback_div = document.createElement("div");
      display_element.insertBefore(feedback_div, display_element.nextElementSibling);
    }

    // show animation
    var animate_interval = setInterval(function () {
      if (!trial.render_on_canvas) {
        display_element.innerHTML = ""; // clear everything
      }
      animate_frame++;
      if (animate_frame == trial.stimuli.length) {
        animate_frame = 0;
        reps++;
        // check if reps complete //
        if (trial.sequence_reps != -1 && reps >= trial.sequence_reps) {
          // done with animation
          showAnimation = false;
        }
      }

      if (showAnimation) {
        if (trial.render_on_canvas) {
          display_element.querySelector<HTMLElement>("#jspsych-categorize-animation-stimulus").style.visibility =
            "visible";
          var img = new Image();
          img.src = trial.stimuli[animate_frame];
          canvas.height = img.naturalHeight;
          canvas.width = img.naturalWidth;
          ctx.drawImage(img, 0, 0);
        } else {
          display_element.innerHTML +=
            '<img src="' +
            trial.stimuli[animate_frame] +
            '" class="jspsych-categorize-animation-stimulus"></img>';
        }
      }

      if (!responded && trial.allow_response_before_complete) {
        // in here if the user can respond before the animation is done
        if (trial.prompt !== null) {
          if (trial.render_on_canvas) {
            prompt_div.style.visibility = "visible";
          } else {
            display_element.innerHTML += trial.prompt;
          }
        }
        if (trial.render_on_canvas) {
          if (!showAnimation) {
            canvas.remove();
          }
        }
      } else if (!responded) {
        // in here if the user has to wait to respond until animation is done.
        // if this is the case, don't show the prompt until the animation is over.
        if (!showAnimation) {
          if (trial.prompt !== null) {
            if (trial.render_on_canvas) {
              prompt_div.style.visibility = "visible";
            } else {
              display_element.innerHTML += trial.prompt;
            }
          }
          if (trial.render_on_canvas) {
            canvas.remove();
          }
        }
      } else {
        // user has responded if we get here.

        // show feedback
        var feedback_text = "";
        if (correct) {
          feedback_text = trial.correct_text.replace("%ANS%", trial.text_answer);
        } else {
          feedback_text = trial.incorrect_text.replace("%ANS%", trial.text_answer);
        }
        if (trial.render_on_canvas) {
          if (trial.prompt !== null) {
            prompt_div.remove();
          }
          feedback_div.innerHTML = feedback_text;
        } else {
          display_element.innerHTML += feedback_text;
        }

        // set timeout to clear feedback
        if (!timeoutSet) {
          timeoutSet = true;
          this.jsPsych.pluginAPI.setTimeout(function () {
            endTrial();
          }, trial.feedback_duration);
        }
      }
    }, trial.frame_time);

    const endTrial = () => {
      clearInterval(animate_interval); // stop animation!
      display_element.innerHTML = ""; // clear everything
      this.jsPsych.finishTrial(trial_data);
    }

    var keyboard_listener;
    var trial_data = {};

    // @ts-ignore Error is: Unreachable code detected: Not all code paths return a value
    const after_response = (info: {key: string, rt: number}) => {
      // ignore the response if animation is playing and subject
      // not allowed to respond before it is complete
      if (!trial.allow_response_before_complete && showAnimation) {
        return false;
      }

      correct = false;
      if (this.jsPsych.pluginAPI.compareKeys(trial.key_answer, info.key)) {
        correct = true;
      }

      responded = true;

      trial_data = {
        stimulus: trial.stimuli,
        rt: info.rt,
        correct: correct,
        response: info.key,
      };

      this.jsPsych.pluginAPI.cancelKeyboardResponse(keyboard_listener);
    };

    keyboard_listener = this.jsPsych.pluginAPI.getKeyboardResponse({
      callback_function: after_response,
      valid_responses: trial.choices,
      rt_method: "performance",
      persist: true,
      allow_held_key: false,
    });

  }
}

export default CategorizeAnimationPlugin;
