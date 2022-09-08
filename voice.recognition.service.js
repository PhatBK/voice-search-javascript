/**
 * Created by phatnh on 8/26/2022 and 4:36 PM.
 */
/* eslint-disable */
import { defaultVoiceRecognitionLanguage, GarbageCollection } from "../_helpers";

const VOICE_COMMAND = {
    stop: ["dừng"],
    search: ["tìm", "tìm kiếm", "ok"],
    back: ["trang chủ", "thoát", "hủy bỏ"],
    play: ["xem", "xem ngay", "xem luôn"],
    shutdown: ["tắt", "đóng"],
    refresh: ["làm mới", "thử lại"]
}

let speechRecognitionInstance;
let final_transcript = "";
let recognizing = false;
let ignore_onend = false;
let start_timestamp = undefined;

const two_line = /\n\n/g;
const one_line = /\n/g;
function linebreak(s) {
    return s.replace(two_line, '<p></p>').replace(one_line, '<br>');
}

const first_char = /\S/;
function capitalize(s) {
    return s.replace(first_char, function(m) { return m.toUpperCase(); });
    // return s.toUpperCase();
}

function resetAllVariable() {
    final_transcript = "";
    recognizing = false;
    ignore_onend = false;
    start_timestamp = undefined;
}

function speechRecognitionHandler(callBackQueue = {}) {
    try {
        if (!webkitSpeechRecognition) {
            console.log("SpeechRecognition + webkitSpeechRecognition not supported")
            return;
        }
        speechRecognitionInstance = new webkitSpeechRecognition();
        speechRecognitionInstance.continuous = true;
        speechRecognitionInstance.interimResults = true;
        speechRecognitionInstance.lang = defaultVoiceRecognitionLanguage;

        speechRecognitionInstance.onstart = () => {
            recognizing = true;
            if (typeof callBackQueue.onstart === "function") {
                callBackQueue.onstart("Speech Recognition Start - onstart");
            }
        };

        speechRecognitionInstance.onerror = (event) => {
            if (typeof callBackQueue.onerror === "function") {
                callBackQueue.onerror(event);
            }
            if (event.error === 'no-speech') {
                ignore_onend = true;
            }
            if (event.error === 'audio-capture') {
                ignore_onend = true;
            }
            if (event.error === 'not-allowed') {
                if (event.timeStamp - start_timestamp < 100) {
                    //todo
                }
                ignore_onend = true;
            }
        };

        speechRecognitionInstance.onend = () => {
            if (typeof callBackQueue.onend === "function") {
                callBackQueue.onend("Speech Recognition Ended");
            }
            recognizing = false;
            if (ignore_onend) {
                return;
            }
        };

        speechRecognitionInstance.onresult = (event) => {
            let interim_transcript = "";
            if (typeof(event.results) == 'undefined') {
                speechRecognitionInstance.onend = null;
                speechRecognitionInstance.stop();
                return;
            }
            for (var i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    final_transcript += event.results[i][0].transcript;
                } else {
                    interim_transcript += event.results[i][0].transcript;
                }
            }
            final_transcript = capitalize(final_transcript);
            final_transcript = linebreak(final_transcript);
            interim_transcript = linebreak(interim_transcript);

            if (typeof callBackQueue.onresult === "function") {
                callBackQueue.onresult({
                    final_transcript: final_transcript,
                    interim_transcript: interim_transcript
                });
            }
        };
    } catch (err) {
        console.log("error: ", err)
    }
}

/**
 * start speech recognition
 * call when setup speechRecognitionHandler
 * */
function speechRecognitionStart() {
    if (!speechRecognitionInstance) return;
    if (recognizing) {
        speechRecognitionInstance.stop();
        return;
    }
    resetAllVariable();
    start_timestamp = Date.now();
    speechRecognitionInstance.start();
    console.log(speechRecognitionInstance)
}

/**
 * stop speech recognition
 * call when out page
 * */
function speechRecognitionStop() {
    if (!speechRecognitionInstance) return;
    speechRecognitionInstance.stop();
    GarbageCollection(speechRecognitionInstance);
}

export const voiceRecognitionService = {
    resetAllVariable,
    speechRecognitionHandler,
    speechRecognitionStart,
    speechRecognitionStop
}
