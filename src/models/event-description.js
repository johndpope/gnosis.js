import {updateEventDescriptions} from '../state';

class EventDescription {
    constructor(props, state) {
        Object.assign(this, props);
        this.state = state;
        this.eventHashes = [];
    }

    getEvents(){
        let events = {};
        for (let eventHash of this.eventHashes) {
            events[eventHash] = this.state.events[eventHash];
        }

        return events;
    }

    update(){
      return updateEventDescriptions(
        this.state.config,
        { descriptionHashes : [this.descriptionHash]}
      );
    }
}

export default EventDescription
