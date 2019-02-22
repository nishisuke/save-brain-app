import firebase from 'firebase/app';
import moment from 'moment'

import React from 'react'

export default class Archived extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      texts: [],
    };
    this.toggleArchiveFunc = this.toggleArchiveFunc.bind(this);
  }

  toggleArchiveFunc(id) {
    return () => {
      let db = firebase.firestore();
      let text = db.collection('texts').doc(id)
      text.update({ archived: false, archivedAt: new Date(2099, 3) })

      let arr = this.state.texts.filter(t => (t.id != id))
      this.setState({texts: [...arr]})
    }
  }

  componentDidMount() {
    let today = new Date()
    let db = firebase.firestore();
    let query = db.collection("texts")
      .where("user_id", "==", window.saveBrainAppFirebaseUser.uid)
      .where('archived', '==', true)
      .where('archivedAt', '<=', new Date(today.getFullYear() + 1, 2))
      .orderBy('archivedAt', 'desc')
      .limit(10)

    query.get().then(s => {
      s.forEach(d => {
        this.setState({texts: [...this.state.texts, {...d.data(), id: d.id}]})
      })
    })
  }

  render() {
    return (
      <div>
      { this.state.texts.map(t => (
        <div key={t.id}>
        <p>{t.string}<span>{moment.unix(t.archivedAt.seconds).fromNow()}</span></p>
        
        <button onClick={this.toggleArchiveFunc(t.id)}>x</button>
        </div>
      )) }
      </div>
    )
  }
}
