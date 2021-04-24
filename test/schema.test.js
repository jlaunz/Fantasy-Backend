require('dotenv').config()
const config = require('config')
const mongoose = require('mongoose')
const HostModel = require('../src/models/Host')
const assert = require('assert')

const mongo_uri = process.env.MONGODB_URI

describe('Test for adding and editing playlists users in mongodb', () => {
    beforeAll(async () => {
        try {
            await mongoose.connect(mongo_uri, {
                useNewUrlParser: true,
                dbName: 'test',
                useFindAndModify: false,
            })
        } catch (err) {
            console.error(err)
            process.exit(1)
        }
    })

    beforeEach(async () => {
        let tracks = [
            {
                uri: 'testUri',
                votes: 0,
                images: {
                    small: 'testImageLink',
                    large: 'testImageLink2',
                },
            },
        ]

        let party = {
            id: 'abc',
            name: 'testPlaylist',
            tracks: tracks,
        }

        let mockDoc = new HostModel({
            id: '234',
            party: party,
        })
        await mockDoc.save()
    })

    afterEach(async () => {
        await HostModel.remove({})
    })

    afterAll(async () => {
        await mongoose.connection.dropDatabase()
        await mongoose.connection.close()
    })

    it('initialise new host successfully', async () => {
        let playlist = {
            id: '12345',
            name: 'testPlaylist',
            tracks: [],
        }

        let validHost = new HostModel({
            id: 'abc123',
            name: 'test1',
            playlists: [playlist],
        })

        let savedHost = await validHost.save()
        expect(savedHost.id).toBe(validHost.id)
    })

    it('find host by id', async () => {
        let host = await HostModel.findOne({ id: '234' })
        expect(host.id).toBe('234')
    })

    it('create host with duplicate id and throw error', async () => {
        let duplicateHost = new HostModel({
            id: '234',
        })

        let ccc = await duplicateHost.save()
        console.log('========\n' + ccc + '\n====')
    })

    it('delete host successfully', async () => {
        await HostModel.deleteOne({ id: '234' })
        let result = await HostModel.findOne({ id: '234' })
        expect(result).toBeNull()
    })

    it('add track to party successfully', async () => {
        let track = {
            uri: 'testTrackUri',
            votes: 3,
            images: {
                small: 'testImageLink',
                large: 'testImageLink2',
            },
        }

        await HostModel.findOneAndUpdate(
            { id: '234' },
            { $push: { 'party.tracks': track } }
        )

        let result = await HostModel.findOne({ id: '234' })
        expect(result).not.toBeNull()
        expect(result.party).not.toBeNull()
        expect(result.party.tracks).not.toBeNull()
        expect(result.party.tracks.length).toBe(2)
    })

    it('get tracks from party given user id and party id successfully', async () => {
        let result = await HostModel.aggregate([
            { $match: { id: '234' } },
            { $unwind: '$party.tracks' },
            { $group: { _id: null, tracks: { $push: '$party.tracks' } } },
            { $project: { tracks: 1, _id: 0 } },
        ])

        expect(result).not.toBeNull()
        expect(result.length).toBe(1)
    })

    it('delete track from party successfully given uri', async () => {
        await HostModel.findOneAndUpdate(
            { id: '234' },
            { $pull: { 'party.tracks': { uri: 'testUri' } } }
        )

        let result = await HostModel.findOne({ id: '234' })
        expect(result).not.toBeNull()
        expect(result.party.tracks.length).toBe(0)
    })

    it('delete party successfully', async () => {
        await HostModel.findOneAndUpdate(
            { id: '234' },
            { $unset: { party: 1 } }
        )
        let result = await HostModel.findOne({ id: '234' })

        expect(result.party).toBeUndefined()
    })
})
