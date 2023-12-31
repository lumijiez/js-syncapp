class Client {
  #ClientSocket;
  #ClientData;

  constructor(room_id) {
    this.#ClientData = { name: 'Guest', id: 0, room: room_id };
    this.#ClientSocket = new WebSocket('ws://93.116.13.156:3000/ws');
    this.isManuallyPaused = true;
    this.isManuallyPlayed = true;
    this.isManuallySeeked = true;
    this.host_field = UTL.$('host_field');
    this.name_field = UTL.$('name_field');
    this.clients_field = UTL.$('clients_field');
    this.name_input = UTL.$('name_input');
    this.global_field = UTL.$('global_field');
    this.global_input = UTL.$('global_input');
    this.room_field = UTL.$('room_field');
    this.video_field = UTL.$('video_field');
    this.link_input = UTL.$('link_input');
    this.room_field.textContent += room_id;
  }

  connect() {

    this.video_field.addEventListener('play', () => {
      if (this.isManuallyPlayed) {
        const js = {
          command: 'play',
          client_id: this.#ClientData.id,
          room_id: this.#ClientData.room,
        };
        this.sendCommand(js);
      } else this.isManuallyPlayed = true;
      console.log("PLAYED")
    });

    video_field.addEventListener('pause', () => {
      if (this.isManuallyPaused) {
        const js = {
          command: 'pause',
          client_id: this.#ClientData.id,
          room_id: this.#ClientData.room,
        };
        this.sendCommand(js);
      } else this.isManuallyPaused = true;
      console.log("PAUSED")
    });

    video_field.addEventListener('seeked', () => {
      if (this.isManuallySeeked) this.syncForVid();
      else this.isManuallySeeked = true;
      console.log("SEEKED");
    });

    this.#ClientSocket.addEventListener('open', () => {
      console.log('Connected to WebSocket');
    });

    this.#ClientSocket.addEventListener('message', (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.command == 'set_id') {
          this.#ClientData.id = msg.id;
          this.refreshData();
          const json = {
            command: 'set_room',
            room_id: this.#ClientData.room,
            id: this.#ClientData.id,
          };
          this.sendCommand(json);
        }

        if (msg.command == 'set_link') {
          this.video_field.src = msg.link;
          this.video_field.play();
        }

        if (msg.command == 'sync') {
          this.isManuallySeeked = false;
          this.video_field.currentTime = msg.time;
          // refresh_data(CLIENT.id, CLIENT.room);
        }

        if (msg.command == 'refresh') {
          this.refreshData();
        }

        if (msg.command == 'play') {
          this.isManuallyPlayed = false;
          this.video_field.play();
        }

        if (msg.command == 'pause') {
          this.isManuallyPaused = false;
          this.video_field.pause();
        }

        if (msg.command == 'message') {
          this.message_field.innerHTML += msg.message + '<br>';
        }

        if (msg.command == 'global') {
          this.global_field.innerHTML += msg.message + '<br>';
        }

        if (msg.command == 'sync_with_me') {
          this.syncVideo();
        }
      } catch (error) {
        console.error('Error parsing JSON:', error);
      }
    });
  }

  getSocket() {
    return this.#ClientSocket;
  }

  getClientData() {
    return this.#ClientData;
  }

  sendCommand(json) {
    this.#ClientSocket.send(JSON.stringify(json));
  }

  syncForVid() {
    const js = {
      command: 'sync_with_host',
      room_id: this.#ClientData.room,
      id: this.#ClientData.id,
    };
    this.sendCommand(js);
  }

  changeName() {
    const js = {
      command: 'change_name',
      id: this.#ClientData.id,
      room_id: this.#ClientData.room,
      name: name_input.value,
    };
    this.sendCommand(js);
  }

  sendGlobal() {
    const js = {
      command: 'global',
      message: global_input.value,
      room_id: this.#ClientData.room,
      name: this.#ClientData.name,
    };
    this.sendCommand(js);
  }

  makeHost() {
    const js = {
      command: 'make_host',
      id: this.#ClientData.id,
      room_id: this.#ClientData.room,
    };
    this.sendCommand(js);
  }

  setLink() {
    const js = {
      command: 'set_link',
      link: link_input.value,
      room_id: this.#ClientData.room,
    };
    this.sendCommand(js);
  }

  syncVideo() {
    const js = {
      command: 'sync',
      time: video_field.currentTime,
      room_id: this.#ClientData.room,
    };
    this.sendCommand(js);
  }

  refreshData() {
    axios
      .post('/api/refresh', {
        id: this.#ClientData.id,
        room_id: this.#ClientData.room,
      })
      .then((response) => {
        const data = response.data;
        this.host_field.textContent = data.host;
        this.#ClientData.name = data.name;
        this.name_field.textContent = `Your name: ${data.name}`;
        this.clients_field.innerHTML = '';
        let clients = JSON.parse(data.client_data);
        for (const client of clients)
          this.clients_field.innerHTML += `<h5>${client.name}</h5>`;
        if (data.link != undefined) this.video_field.src = data.link;
        this.video_field.play();
        this.syncForVid();
      });
  }
}
