class WindowManager 
{
	#windows = [];
	#count = 0;
	#id = null;
	#winData = null;
	#winShapeChangeCallback = null;
	#winChangeCallback = null;
	#pollInterval = null;
	
	constructor ()
	{
		let that = this;
		this.#windows = this.#getStoredWindows();
		this.#startPolling();

		// event listener for when localStorage is changed from another window
		addEventListener("storage", (event) => 
		{
			if (event.key == "windows")
			{
				that.#syncFromStorage();
			}
		});

		// event listener for when current window is about to ble closed
		window.addEventListener('beforeunload', function (e) 
		{
			that.#stopPolling();

			let index = that.getWindowIndexFromId(that.#id);

			//remove this window from the list and update local storage
			that.#windows.splice(index, 1);
			that.updateWindowsLocalStorage();
		});
	}

	// check if theres any changes to the window list
	#didWindowsChange (pWins = [], nWins = [])
	{
		if (pWins.length != nWins.length)
		{
			return true;
		}
		else
		{
			for (let i = 0; i < pWins.length; i++)
			{
				if (!pWins[i] || !nWins[i] || pWins[i].id != nWins[i].id) return true;
			}

			return false;
		}
	}

	#startPolling ()
	{
		if (this.#pollInterval) return;

		this.#pollInterval = setInterval(() => 
		{
			this.#syncFromStorage();
		}, 500);
	}

	#stopPolling ()
	{
		if (!this.#pollInterval) return;

		clearInterval(this.#pollInterval);
		this.#pollInterval = null;
	}

	#getStoredWindows ()
	{
		try
		{
			let stored = localStorage.getItem("windows");
			return stored ? JSON.parse(stored) : [];
		}
		catch (err)
		{
			console.warn("WindowManager: unable to parse windows from storage", err);
			return [];
		}
	}

	#syncFromStorage (force = false)
	{
		let newWindows = this.#getStoredWindows();
		let winChange = force || this.#didWindowsChange(this.#windows, newWindows);

		if (winChange)
		{
			this.#windows = newWindows;
			if (this.#winChangeCallback) this.#winChangeCallback();
		}
	}

	// initiate current window (add metadata for custom data to store with each window instance)
	init (metaData)
	{
		this.#windows = this.#getStoredWindows();
		this.#count= localStorage.getItem("count") || 0;
		this.#count++;

		this.#id = this.#count;
		let shape = this.getWinShape();
		this.#winData = {id: this.#id, shape: shape, metaData: metaData};
		this.#windows.push(this.#winData);

		localStorage.setItem("count", this.#count);
		this.updateWindowsLocalStorage();
	}

	getWinShape ()
	{
		let shape = {x: window.screenLeft, y: window.screenTop, w: window.innerWidth, h: window.innerHeight};
		return shape;
	}

	getWindowIndexFromId (id)
	{
		let index = -1;

		for (let i = 0; i < this.#windows.length; i++)
		{
			if (this.#windows[i].id == id) index = i;
		}

		return index;
	}

	updateWindowsLocalStorage ()
	{
		localStorage.setItem("windows", JSON.stringify(this.#windows));
	}

	update ()
	{
		//console.log(step);
		let winShape = this.getWinShape();

		//console.log(winShape.x, winShape.y);

		if (winShape.x != this.#winData.shape.x ||
			winShape.y != this.#winData.shape.y ||
			winShape.w != this.#winData.shape.w ||
			winShape.h != this.#winData.shape.h)
		{
			
			this.#winData.shape = winShape;

			let index = this.getWindowIndexFromId(this.#id);
			this.#windows[index].shape = winShape;

			//console.log(windows);
			if (this.#winShapeChangeCallback) this.#winShapeChangeCallback();
			this.updateWindowsLocalStorage();
		}
	}

	setWinShapeChangeCallback (callback)
	{
		this.#winShapeChangeCallback = callback;
	}

	setWinChangeCallback (callback)
	{
		this.#winChangeCallback = callback;

		// Immediately notify with the current state so new windows sync instantly
		if (this.#winChangeCallback) this.#syncFromStorage(true);
	}

	getWindows ()
	{
		return this.#windows;
	}

	getThisWindowData ()
	{
		return this.#winData;
	}

	getThisWindowID ()
	{
		return this.#id;
	}
}

export default WindowManager;
