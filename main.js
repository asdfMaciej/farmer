/*
Wykonane przez Macieja Kaszkowiaka, licencja MIT, 
zdjęcia ukradnięte z Google Images 
Dodałem dokładne komentarze dla klasy
*/

// najpierw definiuję stany gry
// są trzy - rzut kostką, wymiana i koniec gry 
const P_ROLLING = 0;
const P_TRADE = 1;
const P_WIN = 2;


/*
 js nie ma w std lib deep-copy obiektow
 Co to oznacza:

 a = {wartosc_zwykla: 10, wartosc_skopiowana: 10}
 b = a 
 c = copy(a)

 b.wartosc_zwykla = 20
 c.wartosc_skopiowana = 20
 // a.wartosc_zwykla == 20
 // a.wartosc_skopiowana == 10

 z copy, nie zmienila sie w oryginalnym obiekcie
*/
function copy(e) {
	return JSON.parse(JSON.stringify(e));
}

// tłumaczenie dla użytkownika w celu wyświetlania
function getPolishName(englishName) {
	let translations = {
		SHEEP: 'owca',
		RABBIT: 'królik',
		PIG: 'świnia',
		COW: 'krowa',
		HORSE: 'koń',
		SMALLDOG: 'mały pies',
		BIGDOG: 'duży pies',
		FOX: 'lis',
		WOLF: 'wilk'
	};

	return translations[englishName];
}

class GameState {
	/* klasa zawiera stan gry, bez logiki */
	initStartingCollection() {
		// ilość zwierząt na początku gry w głównym stadzie 
		this.startingCollection = {
			RABBIT: 60, SHEEP: 24, PIG: 20, 
			COW: 12, HORSE: 6, 
			SMALLDOG: 4, BIGDOG: 2
		};

		// puste stado 
		this.emptyCollection = {
			RABBIT: 0, SHEEP: 0, PIG: 0, COW: 0,
			HORSE: 0, SMALLDOG: 0, BIGDOG: 0
		};

		// wszystkie dostępne wymiany
		// 	w formacie [[ilość, zwierzę], [ilość, zwierzę]]
		this.trade = [
			[[1, "SHEEP"], [6, "RABBIT"]],
			[[1, "PIG"], [2, "SHEEP"]],
			[[1, "COW"], [3, "PIG"]],
			[[1, "HORSE"], [2, "COW"]],
			[[1, "SMALLDOG"], [1, "SHEEP"]],
			[[1, "BIGDOG"], [1, "COW"]]
		];
	}

	initDice() {
		// dwie kostki, każda po 12 ścianek, każda ścianka ma zwierzę
		this.dice = [
			[
				"RABBIT", "RABBIT", "RABBIT", "RABBIT", "RABBIT", "RABBIT",
				"SHEEP", "SHEEP", "SHEEP", "COW", "PIG", "WOLF"
			], [
				"RABBIT", "RABBIT", "RABBIT", "RABBIT", "RABBIT", "RABBIT",
				"SHEEP", "SHEEP", "FOX", "HORSE", "HORSE", "PIG"
			]
		];

		// tutaj będziemy trzymać [zwierzę, zwierzę] z ostatniego rzutu
		// 	w celu pokazywania użytkownikowi
		this.lastRoll = [];
	}

	initPlayers() {
		// dwóch graczy
		this.playersCount = 2;

		// każdemu przydzielam puste stado
		// będę korzystał z tej zmiennej w formie:
		// 	this.playerCollection[idGracza][idZwierzęta]
		this.playerCollection = [
			copy(this.emptyCollection),
			copy(this.emptyCollection)
		];

		// nazywam ich Maciej i Piotr
		// możecie zmienić, aby pytało na początku gry
		this.playerNames = [
			"Maciej", "Piotr"
		];
	}

	initCollection() {
		// inicjuję główne stado
		this.collection = copy(this.startingCollection);
	}

	init() {
		// turn przechowuje nam indeks gracza, który obecnie gra
		this.turn = 0;

		// state przechowuje nam obecny stan gry
		this.state = P_TRADE;

		// wywołuję poprzednie funkcje inicjalizujące zmienne
		this.initStartingCollection();
		this.initDice();
		this.initCollection();
		this.initPlayers();
	}

	getRolledDice() {
		// funkcja losuje ściankę z każdej kostki i zwraca wylosowane
		// 	w formacie [zwierzę, zwierzę] (dla 2 kostek)
		let rolled = [];
		for (let diceSides of this.dice) {
			rolled.push(diceSides[Math.floor(Math.random() * diceSides.length)]);
		}

		return rolled;
	}

	constructor(snackbarFunction=null) {
		// constructor() jest wywoływany zawsze 
		// przy tworzeniu nowej instancji klasy

		// najpierw inicjalizuje zmienne
		this.init();

		// snackbarFunction to funkcja, która zajmie się
		// wyświetlaniem komunikatów

		// zamiast używać console.log(komunikat)
		// 	będę wykorzystywał this.snackbarFunction(komunikat)
		// dzięki temu będą one wyświetlane w taki sposób, jaki zechcę

		if (snackbarFunction !== null) {
			this.snackbar = snackbarFunction;
		} else {
			// domyślna funkcja to console.log <- do konsoli
			this.snackbar = console.log;
		}
	}
}

class Game extends GameState {
	/* 
	klasa zawiera logikę faktycznej gry 
	rozszerza ona klasę GameState, czyli ma wszystkie 
		zmienne, funkcje, itd. jak klasa GameState

	mógłbym zrobić wszystko w jednej klasie, 
		ale tak jest czytelniej
	*/

	rollDice() {
		// najpierw rzucam kostkami
		let rolled = this.getRolledDice();

		// zaczynam tworzyć komunikat dla gracza
		let message = `Wylosowano: `;

		// kopiuję stado gracza
		let collectionWithDices = copy(this.playerCollection[this.turn]);
		
		// dodaję do niego zwierzęta z kostek
		// dzięki temu będę mógł obliczyć, ile par zwierząt ma gracz
		// (stado i kostki włącznie)
		for (let animal of rolled) {
			collectionWithDices[animal] += 1;
			// informuję od razu gracza, co wylosował
			message += `${getPolishName(animal)} `;
		}

		// tworzę zbiór zwierząt do dodania dla gracza
		let newAnimals = copy(this.emptyCollection);

		// tworzę zbiór wylosowanych zwierząt z kostek
		// istnieje po to, aby nie dodawać np. podwójnie królików
		// gdy gracz wylosuje królik, królik
		let rolledAnimals = [];
		for (let animal of rolled) {
			// jeśli zwierzę już było wylosowane - pomijamy
			if (rolledAnimals.includes(animal))
				continue; 

			// wilk i lis traktowane są osobno - pomijamy
			if (animal == 'WOLF' || animal == 'FOX')
				continue;

			// dodaję wylosowane zwierzę do wylosowanych, j.w.
			rolledAnimals.push(animal);

			// liczę pary, zaokrąglając w dół
			let pairs = Math.floor(collectionWithDices[animal] / 2);

			// nie możemy wylosować więcej zwierząt niż jest dostępnych
			// sprawdzam, ile jest zwierząt w głównym stadzie
			let availableAnimals = this.collection[animal];

			// ograniczam ilość nowych zwierząt do ilości w głównym stadzie
			// i zapisuję je jako do dodania dla gracza
			newAnimals[animal] = Math.min(pairs, availableAnimals);
			
			// odejmuję tą ilość od stada
			// zabezpieczam się, aby nie wyszło na minusie
			this.collection[animal] = Math.max(0, availableAnimals - pairs);
		}

		// dodaję graczowi nowe zwierzęta
		for (let animal in newAnimals) {
			let count = newAnimals[animal];
			this.playerCollection[this.turn][animal] += count;
		}

		// teraz zajmuję się lisem i wilkem, które pominąłem wcześniej
		// sprawdzam, czy gracz wylosował lisa
		if (rolled.includes('FOX')) {
			// jeśli jest mały pies, to tylko on ginie
			if (this.playerCollection[this.turn]['SMALLDOG'] > 0) {
				this.playerCollection[this.turn]['SMALLDOG'] -= 1;
				this.collection['SMALLDOG'] += 1;
				message += "\nPrzyszedł lis! Zginął mały pies.";
			} else {
				// gracz nie ma małego psa, więc zabijamy króliki
				let existingRabbits = this.playerCollection[this.turn]['RABBIT'];
				// zostawiamy mu maksymalnie jednego królika
				let deadRabbits = Math.max(0, existingRabbits - 1);
				this.playerCollection[this.turn]['RABBIT'] -= deadRabbits;

				// oddajemy zabite króliki do stada
				this.collection['RABBIT'] += deadRabbits;
				message += "\nPrzyszedł lis! Zginłęły króliki.";
			}
		}

		// sprawdzam, czy gracz wylosował wilka
		if (rolled.includes('WOLF')) {
			// jeśli jest duży pies, to tylko on ginie
			if (this.playerCollection[this.turn]['BIGDOG'] > 0) {
				this.playerCollection[this.turn]['BIGDOG'] -= 1;
				this.collection['BIGDOG'] += 1;
				message += "\nPrzyszedł wilk! Zginął duży pies.";
			} else {
				// gracz nie ma dużego psa, więc zabijamy owce, świnie, krowy
				let killed = ['SHEEP', 'PIG', 'COW'];
				for (let animal of killed) {
					// sprawdzam przed zabiciem ile zwierząt usunąłem
					let deadCount = this.playerCollection[this.turn][animal];
					this.playerCollection[this.turn][animal] = 0;

					// oddajemy zabite zwierzęta do stada
					this.collection[animal] += deadCount;
				}

				message += "\nPrzyszedł wilk! Zginęły krowy, owce, świnie.";
			}
		}

		// ustawiam informacyjnie wartość ostatniego rzutu
		this.lastRoll = rolled;

		// wywołuję funkcję, która powiadomi gracza o komunikacie
		// to ta sama funkcja, którą się ustawia w konstruktorze 
		this.snackbar(message);
	}

	purchase(deal, side) {
		// funkcja ta jest wywoływana przy próbie dobicia utargu
		// deal ma forme: [[ilosc, zwierze], [ilosc, zwierze]]
		let buying = deal[side];

		// |0-1| = 1, |1-1| = 0 <- druga strona dealu po prostu
		let selling = deal[Math.abs(side - 1)];

		// te zmienne nie są konieczne, ale to lepsze nazewnictwo
		// nazywanie zmiennych w przejrzysty sposób to podstawa dobrego kodu
		let buyAmount = buying[0], buyAnimal = buying[1]; 
		let sellAmount = selling[0], sellAnimal = selling[1]; 

		// tłumaczę nazwy na polski - przyda się przy komunikacie
		let buyAnimalPL = getPolishName(buyAnimal);
		let sellAnimalPL = getPolishName(sellAnimal);

		// ok, pora zająć się logiką
		// sprawdzamy, czy gracz ma wystarczająco zwierząt
		let playerAmount = this.playerCollection[this.turn][sellAnimal];
		if (playerAmount < sellAmount) {
			// gracz ma mniej zwierząt, niż chce sprzedać
			this.snackbar(`Nie stać cię na ${buyAmount} ${buyAnimalPL} 
				- masz ${playerAmount} ${sellAnimalPL}, potrzebujesz ${sellAmount}`);
			return; 
		}

		// gracz ma zwierzęta, więc można dobić utarg
		// nie możemy dać więcej zwierząt, niż jest dostępnych w głównym stadzie
		let availableAnimals = this.collection[buyAnimal];

		// dajemy mu więc maksymalnie tyle, ile jest dostępnych
		let boughtAmount = Math.min(availableAnimals, buyAmount);

		// jeśli nie ma już żadnych zwierząt, to nie dobijamy utargu
		if (boughtAmount == 0) {
			this.snackbar(`Nie ma już ${buyAnimalPL} w głównym stadzie! 
				Nie dobito utargu :(`);
			return;
		}

		// dobijamy utarg
		this.playerCollection[this.turn][buyAnimal] += boughtAmount;
		// zabieramy kupione z głównego stada
		this.collection[buyAnimal] -= boughtAmount;

		// oczywiście zabieramy wszystkie, jakie ma
		//	niezależnie od tego, czy dostał wszystkie zakupione
		// gospodarka centralnie sterowana 
		this.playerCollection[this.turn][sellAnimal] -= sellAmount;
		// dodajemy sprzedane do głównego stada
		this.collection[sellAnimal] += sellAmount;

		this.snackbar(`Kupiłeś ${boughtAmount} ${buyAnimalPL} 
			za ${sellAmount} ${sellAnimalPL}!`);
	}

	nextTurn() {
		// funkcja ta jest wywołana przy chęci zmiany tury
		// analizujemy tutaj stan gry oraz turę

		// jeśli obecnie gracz wymienia zwierzęta,
		// to przechodzimy do rzucania kostką
		if (this.state == P_TRADE) {
			this.state = P_ROLLING;
			this.rollDice();
			return;
		}

		// jeśli gracz obecnie rzucał kostką, to zmieniamy gracza
		// i sprawdzamy przy okazji, czy gra się zakończyła
		if (this.state == P_ROLLING) {
			this.state = P_TRADE;

			// przechodzimy do następnego gracza
			this.turn += 1;
			// 0 -> 1 -> 0 -> 1, ... dla 2 graczy
			// 0 -> 1 -> 2 -> 0 -> 1, ... dla 3 graczy
			// itd
			this.turn = this.turn % this.playersCount;
			this.checkWinCondition();
			return;
		}
	}

	checkWinCondition() {
		// sprawdzamy, czy ktoś wygrał
		let winner = null;
		// po kolei sprawdzamy każdego gracza
		for (let player = 0; player < this.playersCount; player++) {
			let animals = this.playerCollection[player];
			// aby gracz wygrał, musi posiadać co najmniej 1 zwierzaka
			let gameEnded = animals['HORSE'] >= 1 
				&& animals['COW'] >= 1
				&& animals['PIG'] >= 1 
				&& animals['SHEEP'] >= 1
				&& animals['RABBIT'] >= 1;

			if (gameEnded) {
				winner = player;
				break;
			}
		}

		// jeśli jest zwycięzca, to kończymy grę
		if (winner !== null) {
			this.state = P_WIN;
			this.snackbar(`${this.playerNames[winner]} wygrał!`);
		}
	}
}

// poniżej jest kod front-endowy - wykorzystuje framework Vue
// do zrozumienia potrzebna jest chociaż podstawowa znajomość Vue

// rejestruję <animal>
Vue.component('animal', {
	props: ['name', 'count'],
	template: '#animal-template'
});

let app = new Vue({
	el: "#game",
	data: {
		// obiekt gry
		game: null,

		// pokazywanie wiadomości
		notification: ''
	},
	created: function() {
		this.game = new Game(this.setNotification);
	},
	methods: {
		nextTurn: function() {
			this.game.nextTurn();
		},
		
		purchase: function(deal, side) {
			this.game.purchase(deal, side);
		},

		setNotification: function(message) {
			// chciałem zaimplementować snackbar, ale zamiast tego
			// cały czas będę pokazywał wiadomości
			this.notification = message;
		}
	},
	computed: {
		playing: function() {
			return this.game.playerNames[this.game.turn];
		},
		state: function() {
			let state = {};

			state[P_ROLLING] = 'Rzucanie kostką';
			state[P_TRADE] = 'Wymiana zwierząt';
			state[P_WIN] = 'Koniec gry';
			
			return state[this.game.state];
		},
		currentlyRolling: function() {return this.game.state == P_ROLLING;},
		currentlyTrading: function() {return this.game.state == P_TRADE;},
		gameEnded: function() {return this.game.state == P_WIN;}
	}
});