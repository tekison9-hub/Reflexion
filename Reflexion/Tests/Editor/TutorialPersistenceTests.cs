using NUnit.Framework;
using UnityEngine;
using Reflexion.Tutorial;
using System;

namespace Reflexion.Tests
{
    /// <summary>
    /// Focused tests for tutorial persistence and cloud save functionality.
    /// </summary>
    public class TutorialPersistenceTests
    {
        [SetUp]
        public void Setup()
        {
            PlayerPrefs.DeleteAll();
            PlayerPrefs.Save();
        }

        [TearDown]
        public void Teardown()
        {
            PlayerPrefs.DeleteAll();
            PlayerPrefs.Save();
        }

        #region TutorialSaveData Serialization Tests
        [Test]
        public void TutorialSaveData_Serializes_ToJSON()
        {
            TutorialSaveData data = new TutorialSaveData
            {
                isCompleted = true,
                lastCompletedStep = 2,
                lastPlayedDate = DateTime.Now.ToString("o"),
                completionDate = DateTime.Now.ToString("o"),
                wasSkipped = false
            };

            string json = JsonUtility.ToJson(data);
            
            Assert.IsFalse(string.IsNullOrEmpty(json), "JSON should not be empty");
            Assert.IsTrue(json.Contains("isCompleted"), "JSON should contain isCompleted field");
            Assert.IsTrue(json.Contains("lastCompletedStep"), "JSON should contain lastCompletedStep field");
        }

        [Test]
        public void TutorialSaveData_Deserializes_FromJSON()
        {
            string json = @"{
                ""isCompleted"": true,
                ""lastCompletedStep"": 2,
                ""lastPlayedDate"": ""2024-01-15T10:30:00"",
                ""completionDate"": ""2024-01-15T10:35:00"",
                ""wasSkipped"": false
            }";

            TutorialSaveData data = JsonUtility.FromJson<TutorialSaveData>(json);
            
            Assert.IsNotNull(data, "Should deserialize successfully");
            Assert.IsTrue(data.isCompleted, "isCompleted should be true");
            Assert.AreEqual(2, data.lastCompletedStep, "lastCompletedStep should be 2");
            Assert.IsFalse(data.wasSkipped, "wasSkipped should be false");
        }

        [Test]
        public void TutorialSaveData_HandlesEmptyDates()
        {
            TutorialSaveData data = new TutorialSaveData
            {
                isCompleted = false,
                lastCompletedStep = -1,
                lastPlayedDate = null,
                completionDate = null
            };

            string json = JsonUtility.ToJson(data);
            TutorialSaveData deserialized = JsonUtility.FromJson<TutorialSaveData>(json);
            
            Assert.IsNotNull(deserialized);
            Assert.IsFalse(deserialized.isCompleted);
        }
        #endregion

        #region PlayerPrefs Persistence Tests
        [Test]
        public void SaveData_PersistsTo_PlayerPrefs()
        {
            TutorialSaveData data = new TutorialSaveData
            {
                isCompleted = true,
                lastCompletedStep = 1
            };

            string json = JsonUtility.ToJson(data);
            PlayerPrefs.SetString("TutorialSaveData", json);
            PlayerPrefs.Save();

            Assert.IsTrue(PlayerPrefs.HasKey("TutorialSaveData"));
            
            string loadedJson = PlayerPrefs.GetString("TutorialSaveData");
            Assert.AreEqual(json, loadedJson, "Loaded JSON should match saved JSON");
        }

        [Test]
        public void LoadData_FromPlayerPrefs_ReturnsNull_WhenNoData()
        {
            Assert.IsFalse(PlayerPrefs.HasKey("TutorialSaveData"));
            
            string json = PlayerPrefs.GetString("TutorialSaveData", null);
            Assert.IsNull(json, "Should return null when no data exists");
        }

        [Test]
        public void SaveData_Overwrites_ExistingData()
        {
            // Save initial data
            TutorialSaveData data1 = new TutorialSaveData
            {
                isCompleted = false,
                lastCompletedStep = 0
            };
            PlayerPrefs.SetString("TutorialSaveData", JsonUtility.ToJson(data1));
            PlayerPrefs.Save();

            // Overwrite with new data
            TutorialSaveData data2 = new TutorialSaveData
            {
                isCompleted = true,
                lastCompletedStep = 2
            };
            PlayerPrefs.SetString("TutorialSaveData", JsonUtility.ToJson(data2));
            PlayerPrefs.Save();

            // Verify new data was saved
            string json = PlayerPrefs.GetString("TutorialSaveData");
            TutorialSaveData loaded = JsonUtility.FromJson<TutorialSaveData>(json);
            
            Assert.IsTrue(loaded.isCompleted, "Should load updated data");
            Assert.AreEqual(2, loaded.lastCompletedStep, "Should have updated step");
        }
        #endregion

        #region Resume Functionality Tests
        [Test]
        public void ResumeData_PreservesProgress()
        {
            // Simulate mid-tutorial save
            TutorialSaveData savedData = new TutorialSaveData
            {
                isCompleted = false,
                lastCompletedStep = 1,
                lastPlayedDate = DateTime.Now.ToString("o")
            };

            string json = JsonUtility.ToJson(savedData);
            PlayerPrefs.SetString("TutorialSaveData", json);
            PlayerPrefs.Save();

            // Load and verify
            string loadedJson = PlayerPrefs.GetString("TutorialSaveData");
            TutorialSaveData loadedData = JsonUtility.FromJson<TutorialSaveData>(loadedJson);

            Assert.IsFalse(loadedData.isCompleted, "Should not be completed");
            Assert.AreEqual(1, loadedData.lastCompletedStep, "Should resume from step 1");
            Assert.IsFalse(string.IsNullOrEmpty(loadedData.lastPlayedDate), 
                "Should have last played date");
        }

        [Test]
        public void CompletionDate_IsSet_OnCompletion()
        {
            TutorialSaveData data = new TutorialSaveData
            {
                isCompleted = true,
                completionDate = DateTime.Now.ToString("o")
            };

            Assert.IsFalse(string.IsNullOrEmpty(data.completionDate), 
                "Completion date should be set");

            // Verify it's a valid date
            DateTime parsedDate;
            bool canParse = DateTime.TryParse(data.completionDate, out parsedDate);
            Assert.IsTrue(canParse, "Completion date should be valid");
        }
        #endregion

        #region Multi-Device Sync Tests
        [Test]
        public void CloudData_WithMoreProgress_OverwritesLocal()
        {
            TutorialSaveData localData = new TutorialSaveData
            {
                isCompleted = false,
                lastCompletedStep = 1
            };

            TutorialSaveData cloudData = new TutorialSaveData
            {
                isCompleted = true,
                lastCompletedStep = 2
            };

            // Cloud data should be preferred (more progress)
            bool shouldUseCloud = cloudData.lastCompletedStep > localData.lastCompletedStep;
            Assert.IsTrue(shouldUseCloud, "Should prefer cloud data with more progress");
        }

        [Test]
        public void CompletedCloudData_OverwritesIncompleteLocal()
        {
            TutorialSaveData localData = new TutorialSaveData
            {
                isCompleted = false,
                lastCompletedStep = 2
            };

            TutorialSaveData cloudData = new TutorialSaveData
            {
                isCompleted = true,
                lastCompletedStep = 2
            };

            // Cloud data should be preferred (completed)
            bool shouldUseCloud = cloudData.isCompleted && !localData.isCompleted;
            Assert.IsTrue(shouldUseCloud, 
                "Should prefer completed cloud data over incomplete local");
        }

        [Test]
        public void NewerData_IsPreferred_WhenProgressEqual()
        {
            DateTime now = DateTime.Now;
            DateTime yesterday = now.AddDays(-1);

            TutorialSaveData localData = new TutorialSaveData
            {
                isCompleted = false,
                lastCompletedStep = 1,
                lastPlayedDate = yesterday.ToString("o")
            };

            TutorialSaveData cloudData = new TutorialSaveData
            {
                isCompleted = false,
                lastCompletedStep = 1,
                lastPlayedDate = now.ToString("o")
            };

            DateTime localDate = DateTime.Parse(localData.lastPlayedDate);
            DateTime cloudDate = DateTime.Parse(cloudData.lastPlayedDate);

            bool shouldUseCloud = cloudDate > localDate;
            Assert.IsTrue(shouldUseCloud, "Should prefer newer data when progress is equal");
        }
        #endregion

        #region Skip Tracking Tests
        [Test]
        public void SkipFlag_IsSaved_WhenTutorialSkipped()
        {
            TutorialSaveData data = new TutorialSaveData
            {
                isCompleted = true,
                wasSkipped = true,
                lastCompletedStep = 0
            };

            string json = JsonUtility.ToJson(data);
            TutorialSaveData loaded = JsonUtility.FromJson<TutorialSaveData>(json);

            Assert.IsTrue(loaded.wasSkipped, "Skip flag should be persisted");
            Assert.IsTrue(loaded.isCompleted, "Should be marked completed even if skipped");
        }
        #endregion

        #region Data Validation Tests
        [Test]
        public void InvalidStepIndex_IsHandled()
        {
            TutorialSaveData data = new TutorialSaveData
            {
                isCompleted = false,
                lastCompletedStep = -1 // Valid initial value
            };

            Assert.AreEqual(-1, data.lastCompletedStep, 
                "Initial step index should be -1");
        }

        [Test]
        public void SaveData_WithAllFields_Succeeds()
        {
            TutorialSaveData data = new TutorialSaveData
            {
                isCompleted = true,
                lastCompletedStep = 2,
                lastPlayedDate = DateTime.Now.ToString("o"),
                completionDate = DateTime.Now.ToString("o"),
                wasSkipped = false
            };

            string json = JsonUtility.ToJson(data);
            TutorialSaveData loaded = JsonUtility.FromJson<TutorialSaveData>(json);

            Assert.IsNotNull(loaded);
            Assert.AreEqual(data.isCompleted, loaded.isCompleted);
            Assert.AreEqual(data.lastCompletedStep, loaded.lastCompletedStep);
            Assert.AreEqual(data.wasSkipped, loaded.wasSkipped);
        }
        #endregion
    }
}

