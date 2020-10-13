import React, { Component } from 'react'
import { Text, View, StyleSheet, Button, Dimensions, Alert } from 'react-native'
import { ScrollView, TextInput, TouchableOpacity } from 'react-native-gesture-handler'
import { AntDesign } from '@expo/vector-icons';
import { FontAwesome } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import Checkbox from '@react-native-community/checkbox';
import { globalStyles, Colors } from '../Styles/GlobalStyles';
import { connect } from 'react-redux'
import { Ionicons } from '@expo/vector-icons';
import { createListItem, deleteListItem, updateListItem } from '../Helper/ListItems';
import * as SQLite from 'expo-sqlite';
import { updateList } from '../Helper/Lists';


class CreateEditListScreen extends Component {

    state = {
        listItems: [],
        listType: '',
        listName: '',
        mode: this.props.navigation.getParam('mode'),
        listItemName: '',
        listProperties: [],
        sliderValueVisible: false,
        db: SQLite.openDatabase('SelectSwitch.db'),
        listID: this.props.navigation.getParam('listID'),
        loaded: false
    }


    componentDidMount() {
        if (this.state.mode === 'edit') {
            const db = this.state.db
            db.transaction((txn) => {
                txn.executeSql(`SELECT * FROM lists where id = ${this.state.listID}`,
                    [],
                    (_, result) => {

                        const list = result.rows._array[0]
                        this.setState({
                            listName: list.listName,
                            listType: list.listType,
                            loaded: true
                        })

                    },
                    (_, err) => {
                        console.log(err)
                    }
                )
            })
            db.transaction((txn) => {
                txn.executeSql(`SELECT * FROM listItems where listID=${this.state.listID}`,
                    [],
                    (_, result) => {

                        const listItems = result.rows._array
                        this.setState({
                            listItems: listItems,
                        })


                    },
                    (_, err) => {
                        console.log(err)
                    }
                )
            })

        }
        const listType = this.props.navigation.getParam('listType')
        this.setState({
            listType: listType
        })
    }

    sliderValueHandler = (event, index) => {
        const listProperties = this.state.listProperties
        listProperties[index].importance = parseInt(event)
        this.setState({
            listProperties: listProperties
        })
    }

    negativeValueToggle = (index) => {
        const listProperties = this.state.listProperties
        listProperties[index].negative = !listProperties[index].negative
        this.setState({
            listProperties: listProperties
        })
    }

    listNameValueHandler = (event) => {
        this.setState({
            listName: event
        })
    }

    listItemNameHandler = (event) => {
        // console.log(event)
        this.setState({
            listItemName: event
        })
    }

    listItemSubmitHandler = () => {
        const listItems = this.state.listItems
        const newItem = this.state.listItemName
        const db = this.state.db
        db.transaction((txn) => {
            txn.executeSql(`INSERT INTO listItems (listID,itemName) VALUES(?,?)`,
                [this.state.listID,newItem],
                (_,result) => {
                    listItems.push({
                        itemName: newItem,
                        id: result.insertId
                    })
                    console.log(result)
                    this.setState({
                        listItems: listItems,
                        listItemName: ''
                    })
                },
                (_, err) => {
                    console.log(err)
                }
            )
        })
        
    }

    listItemDeleteHandler = (id) => {
        const listItems = this.state.listItems
        let index
        for (var i = 0; i < listItems.length; i++) {
            if (listItems[i].id === id) {
                index = i
            }
        }
        Alert.alert(
            'Delete this item?',
            listItems[index].value,
            [
                {
                    text: "Cancel",
                    onPress: () => confirm = false,
                    style: "cancel"
                },
                {
                    text: "OK", onPress: () => {

                        listItems.splice(index, 1)
                        this.setState({
                            listItems: listItems
                        })
                        deleteListItem(listItems[index].id)
                    }
                }
            ],
            { cancelable: true }
        );
    }

    addPropertyHandler = () => {

        const listProperties = this.state.listProperties
        const newProperty = {
            propertyName: '',
            importance: 20,
            info: '',
            negative: false,
            id: new Date()
        }
        listProperties.push(newProperty)
        this.setState({
            listProperties: listProperties
        })
    }

    submitHandler = () => {

        const listName = this.state.listName

        const listProperties = this.state.listProperties
        const listType = this.state.listType

        const db = SQLite.openDatabase('SelectSwitch.db')

        if (this.state.mode === 'create') {
            db.transaction((txn) => {
                txn.executeSql(`INSERT INTO lists (listName,listType,repeatResults,storeResults) VALUES(?,?,?,?)`,
                    [listName, listType, true, true],
                    (_, result) => {
                        const listItems = this.state.listItems
                        // console.log(listItems)
                        for (var i = 0; i < listItems.length; i++) {
                            createListItem(result.insertId, listItems[i].value)
                        }

                        this.props.handleRandomListCreate(listName, listItems)
                        this.props.navigation.pop()
                        this.props.navigation.pop()
                        this.props.navigation.navigate({
                            routeName: 'SelectList', params: {
                                listType: this.state.listType
                            }
                        })
                        return result
                    },
                    (_, err) => {
                        console.log(err)
                        // return reject(err)
                    }
                )
            })
        }
        else {
            updateList(listName,this.state.listID)
            this.props.navigation.pop()
            this.props.navigation.pop()
            this.props.navigation.navigate({
                routeName: 'Result', params: {
                    listName: this.state.listName,
                    listType: this.state.listType,
                    id: this.state.listID,
                }
            })

        }



    }


    render() {
        return (
            this.state.loaded
                ?
                <ScrollView style={styles.container} keyboardShouldPersistTaps='handled'>
                    <TextInput placeholder={"List Name"} placeholderTextColor='#ffffff' style={styles.listNameInput} onChangeText={this.listNameValueHandler} value={this.state.listName} />

                    {this.state.listType === 'logical'
                        ?
                        <View>
                            <Text style={globalStyles.heading}>Properties</Text>

                            {this.state.listProperties.map((item, index) => {
                                return (
                                    <View style={{ marginTop: 20, marginBottom: 40 }, { ...globalStyles.card }}>
                                        <View style={{ flexDirection: 'row' }}>
                                            <TextInput placeholder="Camera" placeholderTextColor='#fff' style={styles.textInput} value={this.state.listProperties[index].propertyName} />
                                            <MaterialIcons name="delete" size={30} style={styles.propertyDeleteIcon} color={Colors.red} />
                                        </View>
                                        <View style={{ flexDirection: 'row' }}>
                                            <TextInput placeholder="Property Info" placeholderTextColor='#fff' style={styles.textInput} value={this.state.listProperties[index].info} />
                                        </View>
                                        <View style={styles.importanceInput}>
                                            <Text style={styles.sliderText}>Importance</Text>

                                            <Slider
                                                style={{ height: 55, flex: 4, width: 100 }}
                                                minimumValue={0}
                                                maximumValue={100}
                                                minimumTrackTintColor={Colors.orange}
                                                maximumTrackTintColor="#333"
                                                thumbTintColor={Colors.orange}
                                                onValueChange={(event) => this.sliderValueHandler(event, index)}
                                                value={this.state.listProperties[index].importance}
                                                onSlidingStart={() => this.setState({ sliderValueVisible: true })}
                                                onSlidingComplete={() => this.setState({ sliderValueVisible: false })}
                                            />
                                            <Text style={styles.sliderValue}>{this.state.sliderValueVisible ? this.state.listProperties[index].importance : null}</Text>
                                        </View>
                                        <View style={{ flex: 1, flexDirection: 'row' }}>
                                            <Text style={styles.sliderText}>Negative Value</Text>
                                            <Checkbox
                                                value={this.state.listProperties[index].negative}
                                                onValueChange={this.negativeValueToggle.bind(this, index)}
                                                style={styles.checkbox}
                                                tintColors={{ true: '#FF7043' }}
                                            />
                                        </View>
                                    </View>
                                )
                            })}

                            <TouchableOpacity>
                                <AntDesign name="pluscircle" size={30} color="#FF7043" style={{ textAlign: 'center', marginVertical: 10 }} onPress={this.addPropertyHandler} />
                            </TouchableOpacity>
                        </View>


                        : null}


                    <View style={styles.listItemInputContainer}>
                        <TextInput placeholder={"List Item"} placeholderTextColor='#ffffff' style={styles.textInput} value={this.state.listItemName} onChangeText={this.listItemNameHandler} />
                        <TouchableOpacity>
                            <AntDesign name="pluscircle" size={30} color="#FF7043" style={styles.plusIcon} onPress={this.listItemSubmitHandler} />
                        </TouchableOpacity>
                    </View>

                    <View style={globalStyles.card}>
                        <Text style={globalStyles.heading}>Current List</Text>
                        {this.state.listItems.map(item => {
                            return (
                                <View style={styles.currentListItem} key={item.id}>
                                    <FontAwesome name="circle" size={10} color="white" style={{ textAlignVertical: 'center' }} />
                                    <Text style={styles.currentListText}>{item.itemName}</Text>
                                    <MaterialIcons name="delete" size={22} style={styles.currentListDeleteIcon} color={Colors.red} onPress={() => this.listItemDeleteHandler(item.id)} />
                                </View>
                            )
                        })}
                    </View>
                    <View style={styles.root}>
                        <Button title="Save" onPress={this.submitHandler} />
                        <Button title="Cancel" />
                    </View>
                </ScrollView>
                : null
        )
    }
}

CreateEditListScreen.navigationOptions = (navData) => {
    const mode = navData.navigation.getParam('mode')
    const listType = navData.navigation.getParam('listType')
    return {
        headerTitle: mode === 'create' ? 'Create List' : 'Edit List',
        headerLeft: () => (
            <View style={styles.backIcon} >
                <Ionicons name="md-arrow-back" size={24} color="white" onPress={() => {
                    if (mode === 'create') {
                        navData.navigation.navigate({
                            routeName: 'SelectList', params: {
                                listType: listType
                            }
                        })
                    } else {
                        navData.navigation.goBack()

                    }

                }
                }
                />
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#171717'
    },
    listNameInput: {
        color: 'white',
        fontSize: 20,
        marginTop: 50,
        marginHorizontal: Dimensions.get('screen').width < 400 ? 10 : 20,
        borderBottomColor: 'grey',
        borderBottomWidth: 1,
        paddingBottom: 10
    },
    textInput: {
        color: 'white',
        fontSize: 20,
        marginTop: 10,
        marginHorizontal: Dimensions.get('screen').width < 400 ? 10 : 20,
        borderBottomColor: 'grey',
        borderBottomWidth: 1,
        paddingBottom: 10,
        width: Dimensions.get('screen').width < 400 ? 240 : 300
    },
    listItemInputContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    plusIcon: {
        justifyContent: 'center',
        alignItems: 'center',
        alignContent: 'center',
        marginTop: 20,
        marginRight: Dimensions.get('screen').width < 400 ? 10 : 20,

    },
    currentListItem: {
        marginLeft: 10,
        marginVertical: 10,
        flexDirection: 'row',
    },
    currentListText: {
        color: '#fff',
        fontSize: 20,
        textAlign: 'left',
        marginLeft: 10
    },
    root: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: "#171717",
        display: 'flex'
    },
    propertyDeleteIcon: {
        textAlignVertical: 'center',
        textAlign: 'right',
        flex: 1,
        marginRight: Dimensions.get('screen').width < 400 ? 5 : 10
    },
    currentListDeleteIcon: {
        textAlignVertical: 'center',
        textAlign: 'right',
        flex: 1,
        paddingRight: Dimensions.get('screen').width < 400 ? 5 : 15
    },
    sliderText: {
        color: '#fff',
        fontSize: 20,
        textAlignVertical: 'center',
        marginLeft: Dimensions.get('screen').width < 400 ? 10 : 20,
        flex: 3
    },
    sliderValue: {
        // fontSize: 20,
        color: '#fff',
        textAlignVertical: 'center',
        flex: 1,
        marginRight: Dimensions.get('screen').width < 400 ? 5 : 15
    },
    importanceInput: {
        flexDirection: 'row',
        width: Dimensions.get('screen').width < 400 ? 320 : 410,
        flex: 1
    },
    checkbox: {
        marginRight: Dimensions.get('screen').width < 400 ? 5 : 10

    },
    backIcon: {
        marginLeft: Dimensions.get('screen').width < 400 ? 10 : 20
    }
})




const mapStateToProps = (state) => ({

})

const mapDispatchToProps = (dispatch) => {
    return {
        handleRandomListCreate: (listName, listItems) => dispatch({ type: 'CREATE_RANDOM_LIST', listName: listName, listItems: listItems })
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(CreateEditListScreen)
