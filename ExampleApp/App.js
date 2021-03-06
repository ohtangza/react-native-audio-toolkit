import React from 'react';
import {
  Text,
  View,
  StyleSheet,
  Switch,
  Slider,
  Button,
} from 'react-native';

import {
  Player,
  Recorder,
  MediaStates,
} from 'react-native-audio-toolkit';

import Moment from 'moment';

let filename = 'test.mp4';

class App extends React.Component {
  constructor() {
    super();

    this.state = {
      playPauseButton: 'Preparing...',
      recordButton: 'Preparing...',

      stopButtonDisabled: true,
      playButtonDisabled: true,
      recordButtonDisabled: true,

      loopButtonStatus: false,
      progress: 0,
      position: 0,
      error: null
    };
  }

  componentWillMount() {
    this.player = null;
    this.recorder = null;
    this.lastSeek = 0;

    this._reloadPlayer();
    this._reloadRecorder();
  }

  _updateState(err) {
    this.setState({
      playPauseButton:      this.player    && this.player.isPlaying     ? 'Pause' : 'Play',
      recordButton:         this.recorder  && this.recorder.isRecording ? 'Stop' : 'Record',

      stopButtonDisabled:   !this.player   || !this.player.canStop,
      playButtonDisabled:   !this.player   || !this.player.canPlay || this.recorder.isRecording,
      recordButtonDisabled: !this.recorder || (this.player         && !this.player.isStopped),
    });
  }

  _playPause() {
    this.player.playPause((err, playing) => {
      if (err) {
        this.setState({
          error: err.message
        });
      }
      this._updateState();
    });
  }

  _stop() {
    this.player.stop(() => {
      this._updateState();
    });
  }

  _seek(percentage) {
    if (!this.player) {
      return;
    }

    this.lastSeek = Date.now();

    let position = percentage * this.player.duration;

    this.player.seek(position, () => {
      this._updateState();
    });
  }

  _reloadPlayer() {
    if (this.player) {
      this.player.destroy();
    }

    this.player = new Player(filename, {
      autoDestroy: false
    }).prepare((err) => {
      if (err) {
        console.log('error at _reloadPlayer():');
        console.log(err);
      } else {
        this.player.looping = this.state.loopButtonStatus;
      }

      this._updateState();
    });

    this.player.on("progress", (data) => {
      let currentTime = data.currentTime;
      this.setState({progress: Math.max(0,  currentTime) / this.player.duration, position: currentTime});
    })

    this.player.on("ended", () => {
      this._updateState();
      this.setState({progress: 0, position: 0});
    })

    this._updateState();
  }

  _reloadRecorder() {
    if (this.recorder) {
      this.recorder.destroy();
    }

    this.recorder = new Recorder(filename, {
      bitrate: 256000,
      channels: 2,
      sampleRate: 44100,
      quality: 'max'
    });

    this.recorder.on("progress", (data)=>{
      let currentTime = data.currentTime;
      this.setState({position: currentTime});
    })

    this._updateState();
  }

  _toggleRecord() {
    if (this.player) {
      this.player.destroy();
    }

    this.recorder.toggleRecord((err, stopped) => {
      if (err) {
        this.setState({
          error: err.message
        });
      }
      if (stopped) {
        this._reloadPlayer();
        this._reloadRecorder();
      }

      this._updateState();
    });
  }

  _toggleLooping(value) {
    this.setState({
      loopButtonStatus: value
    });
    if (this.player) {
      this.player.looping = value;
    }
  }

  render() {
    let position = Moment.utc(this.state.position).format("mm:ss")

    return (
      <View>
        <View>
          <Text style={styles.title}>
            Playback
          </Text>
        </View>
        <View style={styles.buttonContainer}>
          <Button
            onPress={() => this._playPause()}
            title={this.state.playPauseButton}
            disabled={this.state.playButtonDisabled}
            style={styles.button}
          />

          <Button
            onPress={() => this._stop()}
            title='Stop'
            disabled={this.state.stopButtonDisabled}
            style={styles.button}
          />
        </View>
        <View style={styles.settingsContainer}>
          <Switch
          onValueChange={(value) => this._toggleLooping(value)}
          value={this.state.loopButtonStatus} />
          <Text>Toggle Looping</Text>
        </View>
        <View style={styles.slider}>
          <Slider step={0.0001} disabled={this.state.playButtonDisabled} onValueChange={(percentage) => this._seek(percentage)} value={this.state.progress}/>
        </View>
        <View>
          <Text style={styles.title}>
            Recording
          </Text>
        </View>
        <View style={styles.buttonContainer}>
          <Button
            onPress={() => this._toggleRecord()}
            title={this.state.recordButton}
            disabled={this.state.recordButtonDisabled}
            style={styles.button}
          />
        </View>
        <View>
          <Text style={styles.errorMessage}>{position}</Text>
          <Text style={styles.errorMessage}>{this.state.error}</Text>
        </View>
      </View>
    );
  }
}

var styles = StyleSheet.create({
  button: {
    padding: 20,
    fontSize: 20,
    backgroundColor: 'white',
  },
  slider: {
    margin: 10,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingsContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  container: {
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#d6d7da',
  },
  title: {
    fontSize: 19,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 20,
  },
  errorMessage: {
    fontSize: 15,
    textAlign: 'center',
    padding: 10,
    color: 'red'
  }
});

export default App;
