from scipy import misc
import os
import math

folder = '3x5'
output = '3x5'
fontName = '3x5'

def convertPixelToBool(val):
    return val > 250


def writeFile(fileName, text):
    path = fileName+'.txt'
    file = open(path, 'w')

    file.write(str(text))

    file.close()


def createTxt(fileName):
    path = fileName + '.txt'
    return open(path, 'w')


def writeToTxt(file, text):
    file.write(text)


def closeTxt(file):
    file.close()


def stringfyKeyValuePair(key, value):
    return '\t\'' + str(key) + '\': ' + str(value) + ',\n'

def stringfySimpleKeyValuePairs(pairs):
    result = '{'

    for pair in pairs:
        result += str(pair[0]) + ': ' + str(pair[1]) + ', '
    # remove comma+space from end of string

    result = result[:-2] + '}'
    return result


def strOpenObj(objName):
    return '\'' + str(objName) + '\': {\n'

def strCloseObj():
    return '}'

def main():
    escaped_chars = {
        'question_mark': '?',
        'dot': '.',
        'colon': ':',
        'less_than': '<',
        'greater_than': '>',
        'asterisk': '*',
        'space': ' '
    }

    directory = '../' + folder

    subdirlist = os.listdir(directory)

    img_list = []

    for subdir in subdirlist:
        try:
            temp_arr = os.listdir(directory + '/' + subdir)
            img_list += [(file, directory+'/'+subdir+'/'+file) for file in temp_arr]

        except:
            pass
    print([i for i,j in img_list])

    file = createTxt(output)

    writeToTxt(file, strOpenObj(fontName))

    for file_name, file_path in img_list:
        boolArr = []
        arr = misc.imread(file_path, flatten=True)

        leftMost = topMost = math.inf
        rightMost = bottomMost = -math.inf

        for rowIndex, row in enumerate(arr):
            bin = 0
            cols = ['@' if convertPixelToBool(color) else ' ' for color in row]

            for colorIndex, color in enumerate(row):
                boolVal = convertPixelToBool(color)
                bin = (bin << 1) + boolVal

                if boolVal:
                    topMost = min(rowIndex, topMost)
                    bottomMost = max(rowIndex, bottomMost)
                    leftMost = min(colorIndex, leftMost)
                    rightMost = max(colorIndex, rightMost)


            #print(format(bin, '012b'))
            print(cols)

            boolArr.append(bin)

        if 'number' in file_path or not math.isfinite(leftMost+rightMost+topMost+bottomMost):
            leftMost = topMost = 0
            rightMost = len(arr[0]) - 1
            bottomMost = len(arr) - 1

        key = file_name.replace('.png', '')
        key = escaped_chars[key] if key in escaped_chars else key



        value = stringfySimpleKeyValuePairs([['array', boolArr], ['leftMost', leftMost], ['rightMost', rightMost]])
        writeToTxt(file, stringfyKeyValuePair(key, value))

        print('number' in file_path)
        print(topMost, bottomMost)
        print(leftMost, rightMost)


    writeToTxt(file, strCloseObj())

    closeTxt(file)



if __name__ == '__main__':
    main()