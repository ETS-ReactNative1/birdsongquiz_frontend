import React, { Component } from 'react';
import './App.css';
import { API_ROOT } from './api-config';
import _ from 'lodash'
import 'react-bootstrap-typeahead/css/Typeahead.css';
import 'react-bootstrap-typeahead/css/Typeahead-bs4.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck, faTimes, faCrow } from '@fortawesome/free-solid-svg-icons'

class App extends Component {
  constructor(props) {
    super(props);
      this.state = {
          birdsongId: "",
          species: "",
          noRecordingFound: false,
          loading: false,
          showSpecies: false,
          speciesList: [],
          selectedSpeciesGuess: null,
          level: 1,
          counter: 0,
          correctCount: 0,
          livesLeft: 5,
          errorLoading: false,
          expertMode: false,
          guessCorrect: false
      };
    this.callApi('species').then((result) => {
        this.setState((prevState, props) => {
            return {
                ...props,
                speciesList: result.species
            }
        })
    });
  }

    restartGame = () => {
        this.setState((prevState, props) => {
            return {
                ...props,
                level: 1,
                correctCount: 0,
                counter: 0,
                livesLeft: 5
            }
        });
        this.getRandomBirdsong()
    }
    callApi = async (path) => {
        const response = await fetch(`${API_ROOT}/${path}`);
        const body = await response.json();

        if (response.status !== 200) throw Error(body.message);

        return body;
    };

  clearGuess = () => {
      if (this._typeahead) {
          this._typeahead.getInstance().clear();
      }
      if (this.state.selectedSpeciesGuess) {
          this.setState((prevState, props) => {
             return {
                 ...props,
                 selectedSpeciesGuess: null
             }
          });
      }
  }
  getRandomBirdsong = function() {
      this.clearGuess();
      this.setState((prevState, props) => {
          return {
              ...props,
              errorLoading: false,
              loading: true,
              guessCorrect: false
          }
      });
      var randomRecordingApiUrl = `birdsong?level=${this.state.level}`
      this.callApi(randomRecordingApiUrl).then(result => {
          this.setState((prevState, props) => {
              if (result.noRecordings) {
                  return {
                      ...props,
                      noRecordingFound: true,
                      loading: false,
                      showSpecies: false
                  }
              }
              const recording = result.recordingResult.recording
              return {
                  ...props,
                  birdsongId: recording.id,
                  species: recording.en,
                  recordist: recording.rec,
                  scientificName: recording.gen + ' ' + recording.sp,
                  loading: false,
                  showSpecies: false,
                  multipleChoiceOptions: result.multipleChoiceOptions
              }
          });
      }).catch(() => {
            this.setState((prevState, props) => {
                return {
                    ...props,
                    loading: false,
                    errorLoading: true
                }
            })
      });
  }
  showSpecies = () => {
      this.setState((prevState, props) => {
          return {
              ...props,
              showSpecies: !prevState.showSpecies
          }
      })
  }
  onSpeciesGuessMade = (guess) => {
      const levelIncrementInterval = 5
      if (this.state.selectedSpeciesGuess) {
          return
      }
      const guessCorrect = guess != null && guess.ScientificName.toLowerCase() === this.state.scientificName.toLowerCase();
      this.setState((prevState, props) => {
          let correctCount = guessCorrect ? prevState.correctCount + 1 : prevState.correctCount;
          const newCounter = prevState.counter + 1
          let newLevel = prevState.level
          if (correctCount > 0 && correctCount % levelIncrementInterval === 0) {
              newLevel++
          }
          const newLivesLeft = !guessCorrect ? prevState.livesLeft - 1 : prevState.livesLeft
          return {
              ...props,
              selectedSpeciesGuess: guess,
              guessCorrect: guessCorrect,
              correctCount: correctCount,
              counter: newCounter,
              level: newLevel,
              livesLeft: newLivesLeft
          }
      });
  };

  onChangeExpertMode = (expertMode) => {
      this.setState((prevState, props) => {
         return {
             ...props,
             expertMode: expertMode
         }
      });
  }


    componentWillMount = function() {
    this.getRandomBirdsong();
  }

  render() {

    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">Birdsong quiz</h1>
        </header>
        <div className="App-intro">
            <div style={{'margin-bottom': '5px'}}>
                {<div>Score so far {this.state.correctCount}/{this.state.counter }</div>}
                {_.range(0, this.state.livesLeft).map(i =>  <FontAwesomeIcon style={{'font-size': '30px', 'margin': '5px'}} icon={faCrow} /> )}
                { this.state.livesLeft === 0 &&
                <div>
                    Game Over <FontAwesomeIcon style={{'margin-left': '5px'}} transform={{ rotate: 180 }} icon={faCrow} />
                </div>}
            </div>
            {this.state.loading && <div>Loading...</div>}
            {this.state.errorLoading && <div>Error loading data. Please <button href="#" onClick={() => { this.getRandomBirdsong();}}>try again</button></div>}
                {!this.state.loading && this.state.noRecordingFound && <span>No recording found</span>}

                {!this.state.loading &&  !this.state.errorLoading && this.state.birdsongId &&
                !this.state.noRecordingFound &&
                <div>
                    <audio autoPlay={true} controls src={`https://www.xeno-canto.org/${this.state.birdsongId}/download`}>
                    </audio>
                </div>
                }
        </div>
          {!this.state.loading &&
              this.state.multipleChoiceOptions &&
                <div>
                  {this.state.multipleChoiceOptions.map(option => {
                      let backgroundColour = 'gray'
                      if (option === this.state.selectedSpeciesGuess) {
                          backgroundColour = this.state.guessCorrect ? 'green': 'red'
                      }
                      if (this.state.selectedSpeciesGuess && !this.state.guessCorrect &&
                          option.ScientificName.toLowerCase() === this.state.scientificName.toLowerCase()) {
                          backgroundColour = 'green'
                      }
                      return <div key={option.Species} style={{
                          'backgroundColor': backgroundColour,
                          'color': 'white',
                          'border': 'solid 1px',
                          'height': '40px',
                          'verticalAlign': 'middle',
                          'fontSize': '20px',
                          'width': '50%',
                          'marginLeft': '25%',
                          'marginBottom': '5px',
                          'cursor': 'pointer',
                          'paddingTop': '5px'
                      }} onClick={() => this.onSpeciesGuessMade(option)}>{option.Species}
                          { backgroundColour === 'green' && <FontAwesomeIcon style={{'margin-left': '5px'}} icon={faCheck} />}
                          { backgroundColour === 'red' && <FontAwesomeIcon style={{'margin-left': '5px'}} icon={faTimes} />}
                      </div>
                  })
                  }
              </div>
          }
          {
              this.state.selectedSpeciesGuess &&
              <div>
                  <div style={{'border': 'solid 1px',
                      'width': '50%',
                      'marginLeft': '25%',
                      'marginTop': '10px',
                      'marginBottom': '5px'}}>
                      Recording courtesy of {this.state.recordist} via <a target="_blank" href={`http://xeno-canto.org/${this.state.birdsongId}`}>http://xeno-canto.org/{this.state.birdsongId}</a>
                  </div>
                  {this.state.livesLeft > 0 && <button class="btn btn-info" href="#" onClick={() => this.getRandomBirdsong()}>Next -></button>}
              </div>
          }
          {this.state.livesLeft === 0 &&
          <button className="btn btn-info" href="#" onClick={() => this.restartGame()}>Play again?</button>}
      </div>
    );
  }
}

export default App;
