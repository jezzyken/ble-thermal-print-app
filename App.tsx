import * as React from 'react';
import {StyleSheet, View, Text, Button, TextInput} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import {
  BLEPrinter,
  NetPrinter,
  USBPrinter,
  IUSBPrinter,
  IBLEPrinter,
  INetPrinter,
  ColumnAlignment,
  COMMANDS,
} from 'react-native-thermal-receipt-printer-image-qr';

import Loader from './Loader';

const printerList: Record<string, any> = {
  ble: BLEPrinter,
  net: NetPrinter,
  usb: USBPrinter,
};

interface SelectedPrinter
  extends Partial<IUSBPrinter & IBLEPrinter & INetPrinter> {
  printerType?: keyof typeof printerList;
}

export default function App() {
  const [selectedValue, setSelectedValue] =
    React.useState<keyof typeof printerList>('ble');
  const [devices, setDevices] = React.useState([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [selectedPrinter, setSelectedPrinter] = React.useState<SelectedPrinter>(
    {},
  );

  React.useEffect(() => {
    const getListDevices = async () => {
      const Printer = printerList[selectedValue];
      if (selectedValue === 'net') return;
      try {
        setLoading(true);
        await Printer.init();
        const results = await Printer.getDeviceList();
        setDevices(
          results.map((item: any) => ({...item, printerType: selectedValue})),
        );
      } catch (err) {
        console.warn(err);
      } finally {
        setLoading(false);
      }
    };
    getListDevices();
  }, [selectedValue]);

  const handleConnectSelectedPrinter = () => {
    if (!selectedPrinter) return;
    const connect = async () => {
      try {
        setLoading(true);
        switch (selectedPrinter.printerType) {
          case 'ble':
            await BLEPrinter.connectPrinter(
              selectedPrinter?.inner_mac_address || '',
            );
            break;
          case 'net':
            await NetPrinter.connectPrinter('192.168.1.100', 9100);
            break;
          case 'usb':
            await USBPrinter.connectPrinter(
              selectedPrinter?.vendor_id || '',
              selectedPrinter?.product_id || '',
            );
            break;
          default:
        }
      } catch (err) {
        console.warn(err);
      } finally {
        setLoading(false);
      }
    };
    connect();
  };

  const handlePrint = async () => {
    try {
      const Printer = printerList[selectedValue];
      // await Printer.printImage(
      //   'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTftXEB0U48zFN0fSMIxOzaQ2dNT3LE1Od10ns5JJaONQ&s',
      //   {imageWidth: 100, paddingX: 300},
      // );
      // await Printer.printText(
      //   '<C>test\n',
      // );
 
      const BOLD_ON = COMMANDS.TEXT_FORMAT.TXT_BOLD_ON;
      const BOLD_OFF = COMMANDS.TEXT_FORMAT.TXT_BOLD_OFF;
      let orderList = [
        ["1. Lorem ipsum dolor sit amet", "x2", "50$"],
        ["2. Lorem ipsum dolor sit amet", "x4", "8$"],
        [
          "3. Lorem ipsum dolor sit amet",
          "x1",
          "30$",
        ],
        ["4. Lorem ipsum dolor sit amet", "x7", "20$"],
        ["5. Lorem ipsum dolor sit amet", "x10", "60$"],
      ];
      let columnAlignment = [
        ColumnAlignment.LEFT,
        ColumnAlignment.CENTER,
        ColumnAlignment.RIGHT,
      ];
      let columnWidth = [30 - (7 + 12), 7, 12];
      const header = ["Product list", "Qty", "Price"];
      Printer.printColumnsText(header, columnWidth, columnAlignment, [
        `${BOLD_ON}`,
        "",
        "",
      ]);
      for (let i in orderList) {
        Printer.printColumnsText(orderList[i], columnWidth, columnAlignment, [
          `${BOLD_OFF}`,
          "",
          "",
        ]);
      }
      Printer.printBill(`Thank you\n`);
    } catch (err) {
      console.warn(err);
    }
  };

  const handleChangePrinterType = async (type: keyof typeof printerList) => {
    setSelectedValue(prev => {
      printerList[prev].closeConn();
      return type;
    });
    setSelectedPrinter({});
  };

  const handleChangeHostAndPort = (params: string) => (text: string) =>
    setSelectedPrinter(prev => ({
      ...prev,
      device_name: 'Net Printer',
      [params]: text,
      printerType: 'net',
    }));

  const _renderNet = () => (
    <View style={{paddingVertical: 16}}>
      <View style={styles.rowDirection}>
        <Text>Host: </Text>
        <TextInput
          placeholder="192.168.100.19"
          onChangeText={handleChangeHostAndPort('host')}
        />
      </View>
      <View style={styles.rowDirection}>
        <Text>Port: </Text>
        <TextInput
          placeholder="9100"
          onChangeText={handleChangeHostAndPort('port')}
        />
      </View>
    </View>
  );

  const _renderOther = () => (
    <Picker selectedValue={selectedPrinter} onValueChange={setSelectedPrinter}>
      {devices.map((item: any, index) => (
        <Picker.Item
          label={item.device_name}
          value={item}
          key={`printer-item-${index}`}
        />
      ))}
    </Picker>
  );

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text>Select printer type: </Text>
        <Picker
          selectedValue={selectedValue}
          onValueChange={handleChangePrinterType}>
          {Object.keys(printerList).map((item, index) => (
            <Picker.Item
              label={item.toUpperCase()}
              value={item}
              key={`printer-type-item-${index}`}
            />
          ))}
        </Picker>
      </View>
      <View style={styles.section}>
        <Text>Select printer: </Text>
        {selectedValue === 'net' ? _renderNet() : _renderOther()}
      </View>
      <Button
        disabled={!selectedPrinter?.device_name}
        title="Connect"
        onPress={handleConnectSelectedPrinter}
      />
      <Button
        disabled={!selectedPrinter?.device_name}
        title="Print sample"
        onPress={handlePrint}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  section: {
    flex: 1,
  },
  rowDirection: {
    flexDirection: 'row',
  },
});
