#include "FastLED.h"
#include <SPI.h>
#include <WiFi.h>
#include <WiFiUdp.h>
#include <limits.h>

// CONSTANTS
int status = WL_IDLE_STATUS;
char ssid[] = "Ay"; //  your network SSID (name)
char pass[] = "minhainternet";    // your network password (use for WPA, or use as key for WEP)
const unsigned int localPort = 2390;      // local port to listen on

const int MAX_LENGTH = 2049;
const int ANSWER_LENGTH = 1024;

WiFiUDP Udp;

struct LedsStruct {
	static const unsigned int DATA_PIN = 6;
	static const unsigned int ROWS = 12;
	static const unsigned int COLS = 12;
	static const unsigned int NUM_LEDS = ROWS*COLS;
	uint8_t brightness = 64;
	CRGB buffer[NUM_LEDS]; // Define the array of leds
};

LedsStruct _leds;

struct Global {
	char packetBuffer[MAX_LENGTH]; //buffer to hold incoming packet
	char  ReplyBuffer[1024];       // a string to send back
	long totalCounter = 0;
	const unsigned int maxTempCounter = 5;
	unsigned int tempCounter = 0;
	long outOfOrderCounter = 0;
	unsigned int lastStamp = 0;
	unsigned long lastAnswerTimestamp = 0;
	int deltaRecvTime = -1;
	unsigned int tempMinDeltaRecvTime = UINT_MAX;
	unsigned int tempMaxDeltaRecvTime = 0;
	unsigned int accumulatorRecvTime = 0;
	int outOfOrder[9] = { -1, -1, -1, -1, -1, -1, -1, -1, -1 };

	unsigned long tempTimer = 0;
	const unsigned long maxTempTimer = 250;
};
Global global;

struct Statistics {
	unsigned int circularQueue[10] = { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 };
	unsigned int indexFromQueue = 0;
	unsigned int accumulatorFromQueue = 0;
	unsigned int prevEvaluatedStamp = 0;
	unsigned int lossRate = 0;

	unsigned int queueSize = sizeof(circularQueue) / sizeof(circularQueue[0]);
	unsigned int totalPacketsRecv = global.maxTempCounter * queueSize;

	long ppsTempTimer = 0;
	unsigned int ppsCounter = 0;
	unsigned int pps = 0;
};
Statistics _stat;

const int LED_PIN = 2;
const int NUM_LEDS = 144;
const int BRIGHTNESS = 64;
#define LED_TYPE    WS2811
#define COLOR_ORDER GRB
CRGB leds[NUM_LEDS];

void setup() {


	FastLED.addLeds<LED_TYPE, LED_PIN, COLOR_ORDER>(leds, NUM_LEDS).setCorrection(TypicalLEDStrip);
	FastLED.setBrightness(BRIGHTNESS);
	//FastLED.addLeds<WS2811, 6, GRB>(leds.buffer, 150);
	//FastLED.setBrightness(leds.brightness);

	//Initialize serial and wait for port to open:
	Serial.begin(115200);
	while (!Serial) {
		; // wait for serial port to connect. Needed for native USB port only
	}

	// attempt to connect to Wifi network:
	while (status != WL_CONNECTED) {
		Serial.print("Attempting to connect to SSID: ");
		Serial.println(ssid);
		// Connect to WPA/WPA2 network. Change this line if using open or WEP network:
		status = WiFi.begin(ssid, pass);

		// wait 10 seconds for connection:
		delay(5000);
	}
	Serial.println("Connected to wifi");
	printWifiStatus();

	Serial.println("\nStarting connection to server...");
	// if you get a connection, report back via serial:
	Udp.begin(localPort);
}

void loop() {

	// if there's data available, read a packet
	int packetSize = Udp.parsePacket();
	if (packetSize) {
		long currentTimeStamp = millis();
		global.deltaRecvTime = currentTimeStamp - global.lastAnswerTimestamp;
		global.lastAnswerTimestamp = currentTimeStamp;
		//    Serial.print("Received packet of size ");
		//    Serial.println(packetSize);
		//    Serial.print("From ");
		//    IPAddress remoteIp = Udp.remoteIP();
		//    Serial.print(remoteIp);
		//    Serial.print(", port ");
		//    Serial.println(Udp.remotePort());

			// read the packet into packetBufffer
		int len = Udp.read(global.packetBuffer, MAX_LENGTH);
		//    if (len > 0) {
		//      global.packetBuffer[len] = 0;
		//    }
		//    Serial.println("Contents:");
		//    Serial.println(global.packetBuffer);

			//send a reply, to the IP address and port that sent us the packet we received
			//Udp.beginPacket(Udp.remoteIP(), Udp.remotePort());
			//Udp.printf("%s", global.ReplyBuffer);
			//Udp.endPacket();

		unsigned int currentStamp = getIntFrom4Bytes(0, global.packetBuffer);

		if (checkIsTimeout())
			sendAnswer(currentStamp);

		updateGlobalVariables(currentStamp);
		updateStatistics(currentStamp);

		processLeds();

		/*if (global.tempCounter == global.maxTempCounter)
			sendAnswer(currentStamp);*/

		const int jump = 12 *12* 3 - 3;

		printRGBIntervalReceivedPack(global.packetBuffer, 4+jump, 6+jump);
		//printReceivedPack(global.packetBuffer, len);
		//printRecvBasicInfo(global.totalCounter, currentStamp, len);
	}
	else {
		if (global.totalCounter && millis() - global.lastAnswerTimestamp > 4000) {

			// send a reply with the number of packets received
			Udp.beginPacket(Udp.remoteIP(), Udp.remotePort());
			Udp.printf("No of packets received by ESP: %d", global.totalCounter);
			Udp.endPacket();

			Udp.beginPacket(Udp.remoteIP(), Udp.remotePort());
			Udp.printf("No of packets received out of order: %d", global.outOfOrderCounter);
			Udp.endPacket();

			char msg[256];
			stringifyIntArray(global.outOfOrder, msg);

			Udp.beginPacket(Udp.remoteIP(), Udp.remotePort());
			Udp.printf("Stamps out of order: %s", msg);
			Udp.endPacket();

			resetGlobalVariables();
			resetStatistics();
		}
	}
}

void printReceivedPack(char* packetBuffer, int numBytes) {
	Serial.println("Contents:");

	for (int i = 0; i < numBytes; i++) {
		int value = int(packetBuffer[i]);
		Serial.print(i + 1); Serial.print(" : "); Serial.println(value);
	}

	Serial.println();
}

void printRGBIntervalReceivedPack(char* packetBuffer, int startIndex, int endIndex) {
	Serial.print("RGB Contents: ");

	for (int i = startIndex; i+2 <= endIndex; i+=3) {

		Serial.printf("(%d, %d, %d) ", 
						int(packetBuffer[i]), int(packetBuffer[i+1]), int(packetBuffer[i+2]));

	}

	Serial.println();

}

void printRecvBasicInfo(int counter, int stamp, int len) {
	Serial.print("Counter: "); Serial.print(counter);
	Serial.print("  Stamp: "); Serial.print(stamp);
	Serial.print("  length: "); Serial.println(len);
}

void printWifiStatus() {
	// print the SSID of the network you're attached to:
	Serial.print("SSID: ");
	Serial.println(WiFi.SSID());

	// print your WiFi shield's IP address:
	IPAddress ip = WiFi.localIP();
	Serial.print("IP Address: ");
	Serial.println(ip);

	// print the received signal strength:
	long rssi = WiFi.RSSI();
	Serial.print("signal strength (RSSI):");
	Serial.print(rssi);
	Serial.println(" dBm");
}

unsigned int getIntFrom4Bytes(int offset, char* data) {
	return  (data[offset] << 24) |
		(data[offset + 1] << 16) |
		(data[offset + 2] << 8) |
		data[offset + 3];
}

void get4BytesFromInt(int num, char* data) {
	data[0] = num >> 24 & 0xff;
	data[1] = num >> 16 & 0xff;
	data[2] = num >> 8 & 0xff;
	data[3] = num & 0xff;

}

void stringifyIntArray(int* intArray, char* str) {
	char tempBuffer[10];

	str[0] = '\0';

	for (int i = 0; intArray[i] != -1; i++) {
		itoa(intArray[i], tempBuffer, 10);
		strcat(str, tempBuffer);
		strcat(str, " ");
	}
}

void resetGlobalVariables() {
	global.totalCounter = 0;
	global.tempCounter = 0;
	global.outOfOrderCounter = 0;
	global.lastStamp = 0;

	global.tempMinDeltaRecvTime = UINT_MAX;
	global.tempMaxDeltaRecvTime = 0;

	int i = 0;
	while (global.outOfOrder[i] != -1)
		global.outOfOrder[i] = -1;
}

void updateGlobalVariables(unsigned int stamp) {
	if (stamp < global.lastStamp) {
		global.outOfOrder[global.outOfOrderCounter] = stamp;
		global.outOfOrderCounter++;
	}

	/*
	if (global.tempCounter < global.maxTempCounter) {
		++global.tempCounter;
		if (global.deltaRecvTime > 0) { 
			global.accumulatorRecvTime += global.deltaRecvTime; 
		
			if (global.deltaRecvTime > global.tempMaxDeltaRecvTime)
				global.tempMaxDeltaRecvTime = global.deltaRecvTime;
			else if(global.deltaRecvTime < global.tempMinDeltaRecvTime)
				global.tempMinDeltaRecvTime = global.deltaRecvTime;

		}
	}
	else {
		global.tempCounter = 1;
		global.accumulatorRecvTime = global.deltaRecvTime;
		global.tempMinDeltaRecvTime = global.deltaRecvTime;
		global.tempMaxDeltaRecvTime = global.deltaRecvTime;
	}
	*/

	if (!checkIsTimeout()) {
		++global.tempCounter;
		if (global.deltaRecvTime > 0) {
			global.accumulatorRecvTime += global.deltaRecvTime;

			if (global.deltaRecvTime > global.tempMaxDeltaRecvTime)
				global.tempMaxDeltaRecvTime = global.deltaRecvTime;
			else if (global.deltaRecvTime < global.tempMinDeltaRecvTime)
				global.tempMinDeltaRecvTime = global.deltaRecvTime;

		}
	}
	else {
		/*Serial.print("******AccRecvTime: ");
		Serial.print(global.accumulatorRecvTime);
		Serial.print(", tempCounter: ");
		Serial.println(global.tempCounter);*/

		global.tempTimer = global.lastAnswerTimestamp;
		global.accumulatorRecvTime = global.deltaRecvTime;
		global.tempCounter = 1;
		global.tempMinDeltaRecvTime = global.deltaRecvTime;
		global.tempMaxDeltaRecvTime = global.deltaRecvTime;
	}


	global.lastStamp = stamp;
	++global.totalCounter;

}

void resetStatistics() {
	return;
}

void updateStatistics(unsigned int stamp) {

	if (global.lastAnswerTimestamp - _stat.ppsTempTimer > 1000){
		_stat.pps = _stat.ppsCounter;
		_stat.ppsCounter = 1;
		_stat.ppsTempTimer = global.lastAnswerTimestamp;
	}
	else {
		_stat.ppsCounter++;
	}


	if (global.totalCounter % global.maxTempCounter == 0) {
		unsigned int stampDiff = abs(stamp - _stat.prevEvaluatedStamp);
		
		_stat.accumulatorFromQueue -= _stat.circularQueue[_stat.indexFromQueue];
		_stat.accumulatorFromQueue += stampDiff;
		_stat.circularQueue[_stat.indexFromQueue] = stampDiff;

		
		/*if (_stat.accumulatorFromQueue >= _stat.totalPacketsRecv) {
			_stat.lossRate = 100 * (_stat.accumulatorFromQueue - _stat.totalPacketsRecv) / _stat.accumulatorFromQueue;
			Serial.print("stamp: ");
			Serial.print(stamp);
			Serial.print(",  Acc[");
			Serial.print(_stat.indexFromQueue);
			Serial.print("]:");
			Serial.print(_stat.accumulatorFromQueue);
			Serial.print(", fpsCounter: ");
			Serial.print(_stat.pps);
			Serial.print(",  lossRate: ");
			Serial.println(_stat.lossRate); 
		}
		else {
			Serial.print("not calculated ");
			Serial.println(stamp);
		}*/
		

		_stat.prevEvaluatedStamp = stamp;
		_stat.indexFromQueue = (_stat.indexFromQueue + 1) % _stat.queueSize;
	}
}

inline bool checkIsTimeout() {
	return (global.lastAnswerTimestamp - global.tempTimer >= global.maxTempTimer);
}

void sendAnswer() {
	sendAnswer(0);
}

void sendAnswer(unsigned int stamp) {
	unsigned int avgTime = (global.tempCounter > 0 ? (global.accumulatorRecvTime / global.tempCounter) : 100);

	Udp.beginPacket(Udp.remoteIP(), Udp.remotePort());
	Udp.printf("{\"stamp\": %d, \"deltaTime\": %d, \"minDeltaTime\": %d, \"maxDeltaTime\": %d, \"lossRate\": %d, \"pps\": %d, \"signal\": %d}",
				   stamp,		 avgTime, global.tempMinDeltaRecvTime, global.tempMaxDeltaRecvTime, _stat.lossRate, _stat.pps, WiFi.RSSI());
	Udp.endPacket();
}

void processLeds() {
	//Serial.println("leds");
	
	const char* buffer = global.packetBuffer;
	int start = 4;

	/*for (CRGB& pixel : leds) {
		pixel = CRGB(buffer[start], buffer[start+1], buffer[start+2]);
		start += 3;
	}*/

	/*for (int index = 0; index < _leds.NUM_LEDS; index++) {
		int currentRow = index / _leds.COLS;
		int correctedIndex;

		if (currentRow % 2 == 0)
			correctedIndex = index;
		else
			correctedIndex = (2 * currentRow + 1)*_leds.COLS - 1;
			
		leds[correctedIndex] = CRGB(buffer[start], buffer[start + 1], buffer[start + 2]);
		start += 3;
	}*/

	for (int row = 0; row < _leds.ROWS; row++) {
		if (row % 2 == 0) {
			for (int col = 0; col < _leds.COLS; col++) {
				leds[row*_leds.COLS + col] = CRGB(buffer[start], buffer[start + 1], buffer[start + 2]);
				start += 3;
			}
		}
		else {
			for (int col = _leds.COLS - 1; col >= 0; col--) {
				leds[row*_leds.COLS + col] = CRGB(buffer[start], buffer[start + 1], buffer[start + 2]);
				start += 3;
			}
		}
	}



	//leds[0] = CRGB(255, 0, 0);
	//leds[NUM_LEDS-1] = CRGB(0, 0, 255);

	FastLED.show();
}
